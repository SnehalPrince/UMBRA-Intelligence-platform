# UMBRA — Project Structure

> Canonical File Tree & Module Ownership Reference

**Version:** 1.0.0  
**Author:** Hardik Bhaskar  
**Status:** Draft → Review  
**Last Updated:** June 2026

---

## Table of Contents

1. [Repository Overview](#1-repository-overview)
2. [Root Level](#2-root-level)
3. [services/ — Microservices](#3-services--microservices)
4. [apps/ — User-Facing Applications](#4-apps--user-facing-applications)
5. [shared/ — Cross-Service Libraries](#5-shared--cross-service-libraries)
6. [infra/ — Infrastructure as Code](#6-infra--infrastructure-as-code)
7. [docs/ — Documentation](#7-docs--documentation)
8. [scripts/ — Developer Tooling](#8-scripts--developer-tooling)
9. [Module Ownership Map](#9-module-ownership-map)
10. [Naming Conventions](#10-naming-conventions)
11. [Environment Configuration](#11-environment-configuration)
12. [Local Development Setup](#12-local-development-setup)

---

## 1. Repository Overview

UMBRA follows a **monorepo** strategy with logical separation by function. All services, frontend apps, shared libraries, and infrastructure code live in one repository under `umbra-platform/`.

**Monorepo tooling:**
- **Python services:** `uv` workspaces + `pyproject.toml` per service
- **Node/TypeScript services:** `pnpm` workspaces + `package.json` per app
- **Go services:** Standard Go modules (`go.mod` per service)
- **CI/CD:** GitHub Actions with path-filtered workflows (changes in `services/collector/` only trigger the collector pipeline)

---

## 2. Root Level

```
umbra-platform/                         ← Repository root
│
├── .github/
│   ├── workflows/
│   │   ├── ci-collector.yml            ← Python: lint, test, build, push collector image
│   │   ├── ci-processor.yml
│   │   ├── ci-intelligence.yml
│   │   ├── ci-matcher.yml              ← Go: vet, test, build
│   │   ├── ci-alert-engine.yml
│   │   ├── ci-notification.yml         ← Node: lint, test, build
│   │   ├── ci-dashboard-bff.yml
│   │   ├── ci-identity.yml
│   │   ├── ci-web.yml                  ← Next.js: lint, build, Playwright E2E
│   │   ├── deploy-staging.yml          ← Auto-deploy on merge to main
│   │   ├── deploy-production.yml       ← Manual approval gate
│   │   └── schema-compat.yml           ← Kafka schema backward-compatibility check
│   │
│   ├── CODEOWNERS                      ← Per-directory ownership (see §9)
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml                  ← Weekly dependency update PRs
│
├── .husky/                             ← Git hooks: pre-commit lint + type-check
├── .vscode/                            ← Shared editor settings, recommended extensions
│
├── docker-compose.yml                  ← Full local dev stack (all services + datastores)
├── docker-compose.test.yml             ← Lightweight integration test stack
│
├── Makefile                            ← Common developer commands (see §8)
├── README.md                           ← Project overview + quickstart
├── CONTRIBUTING.md
├── SECURITY.md                         ← Responsible disclosure policy
├── LICENSE
│
└── [service dirs, app dirs, shared, infra, docs, scripts]
```

---

## 3. services/ — Microservices

Each service is a self-contained deployable unit with its own `Dockerfile`, dependencies, tests, and Kubernetes manifests.

### 3.1 `services/collector/` — Python 3.12

The data collection layer. Crawls Tor, Telegram, paste sites, GitHub, I2P, and external feeds. Publishes raw events to Kafka topic `raw.events`.

```
services/collector/
│
├── Dockerfile
├── pyproject.toml                      ← uv project config, dependencies
├── README.md
│
├── src/
│   └── collector/
│       ├── __init__.py
│       ├── main.py                     ← Entry point: starts orchestrator + scheduler
│       ├── orchestrator.py             ← CollectorOrchestrator — manages all collectors
│       │
│       ├── collectors/
│       │   ├── base.py                 ← Abstract BaseCollector class
│       │   ├── tor_collector.py        ← .onion site crawler (stem + SOCKS5)
│       │   ├── telegram_collector.py   ← Telegram MTProto client (Telethon)
│       │   ├── paste_collector.py      ← Pastebin, Ghostbin, 0bin, etc.
│       │   ├── github_collector.py     ← Public repo secret scanning
│       │   ├── i2p_collector.py        ← I2P eepsite crawler
│       │   └── feed_collector.py       ← HaveIBeenPwned, MISP, OTX feeds
│       │
│       ├── proxy/
│       │   ├── tor_proxy.py            ← Tor SOCKS5 + circuit rotation (stem)
│       │   ├── residential_proxy.py    ← Residential proxy pool manager
│       │   └── fingerprint.py          ← Random UA/headers for fingerprint evasion
│       │
│       ├── publisher/
│       │   └── kafka_publisher.py      ← Publishes to raw.events Kafka topic
│       │
│       ├── source_registry/
│       │   ├── sources.json            ← Registered source list (ID, URL, type, tier)
│       │   └── registry.py             ← Load/validate source registry
│       │
│       └── config.py                   ← Settings (from env vars via Pydantic Settings)
│
└── tests/
    ├── unit/
    │   ├── test_orchestrator.py
    │   ├── test_tor_collector.py
    │   └── test_fingerprint.py
    └── integration/
        └── test_kafka_publish.py       ← Requires Kafka + schema registry
```

---

### 3.2 `services/processor/` — Python 3.12

Consumes `raw.events`, normalizes/parses content, extracts credentials, deduplicates, hashes PII, and publishes to `processed.events`.

```
services/processor/
│
├── Dockerfile
├── pyproject.toml
│
├── src/
│   └── processor/
│       ├── main.py
│       ├── consumer.py                 ← Kafka consumer loop
│       │
│       ├── pipeline/
│       │   ├── classifier.py           ← FastText + BERT content classification
│       │   ├── extractor.py            ← Regex + spaCy NER credential extraction
│       │   ├── deduplicator.py         ← MinHash LSH (datasketch) dedup
│       │   ├── sanitizer.py            ← SHA-256 hash email, mask password
│       │   └── normalizer.py           ← Field normalization, timestamp parsing
│       │
│       ├── models/
│       │   ├── fasttext_model/         ← Downloaded at build time from model registry
│       │   └── bert_model/
│       │
│       ├── publisher/
│       │   └── kafka_publisher.py
│       │
│       └── config.py
│
└── tests/
    ├── unit/
    │   ├── test_extractor.py
    │   ├── test_deduplicator.py
    │   └── test_sanitizer.py
    └── fixtures/
        └── sample_events/              ← Anonymized sample raw events for testing
```

---

### 3.3 `services/intelligence/` — Python 3.12

Consumes `processed.events`. Runs XGBoost risk scoring, LLM enrichment (Claude), and MITRE ATT&CK mapping.

```
services/intelligence/
│
├── Dockerfile
├── pyproject.toml
│
├── src/
│   └── intelligence/
│       ├── main.py
│       ├── consumer.py
│       │
│       ├── scoring/
│       │   ├── risk_scorer.py          ← XGBoost inference (Architecture.md §5)
│       │   ├── feature_engineer.py     ← Feature extraction for risk model
│       │   └── model/
│       │       └── xgboost_risk_v3.ubj ← Versioned model binary
│       │
│       ├── enrichment/
│       │   ├── llm_enricher.py         ← Anthropic Claude API client + prompt templates
│       │   ├── prompt_templates.py     ← Versioned prompt strings
│       │   ├── mitre_mapper.py         ← ATT&CK technique mapping (rules + LLM)
│       │   └── llm_cache.py            ← Redis-based LLM response cache
│       │
│       ├── mlops/
│       │   ├── mlflow_client.py        ← Model version tracking
│       │   └── retrain_trigger.py      ← Scheduled model re-evaluation
│       │
│       └── config.py
│
└── tests/
    ├── unit/
    │   ├── test_risk_scorer.py
    │   ├── test_llm_enricher.py
    │   └── test_mitre_mapper.py
    └── integration/
        └── test_enrichment_pipeline.py
```

---

### 3.4 `services/matcher/` — Go 1.23

High-throughput Kafka Streams-equivalent: matches processed events against all active org watchlists. Publishes to `alert.candidates`.

```
services/matcher/
│
├── Dockerfile
├── go.mod
├── go.sum
│
├── cmd/
│   └── matcher/
│       └── main.go                     ← Entry point
│
├── internal/
│   ├── consumer/
│   │   └── kafka.go                    ← Kafka consumer group
│   │
│   ├── matcher/
│   │   ├── engine.go                   ← AssetMatcher core logic
│   │   ├── domain_index.go             ← In-memory trie for domain matching
│   │   ├── keyword_index.go            ← Aho-Corasick automaton for keyword matching
│   │   ├── hash_index.go               ← Hash set for email hash matching
│   │   └── ip_index.go                 ← IP range lookup (CIDR tree)
│   │
│   ├── watchlist/
│   │   ├── loader.go                   ← Loads watchlists from PostgreSQL on startup
│   │   ├── refresher.go                ← Listens for watchlist change events → hot reload
│   │   └── cache.go                    ← In-memory watchlist store
│   │
│   ├── publisher/
│   │   └── kafka.go                    ← Publishes to alert.candidates
│   │
│   └── config/
│       └── config.go
│
└── tests/
    ├── unit/
    │   ├── engine_test.go
    │   ├── domain_index_test.go
    │   └── keyword_index_test.go
    └── integration/
        └── kafka_roundtrip_test.go
```

---

### 3.5 `services/alert-engine/` — Go 1.23

Consumes `alert.candidates`, deduplicates against delivered alerts (Redis), persists confirmed alerts to PostgreSQL, and publishes to `alerts.confirmed`.

```
services/alert-engine/
│
├── Dockerfile
├── go.mod
│
├── cmd/
│   └── alert-engine/
│       └── main.go
│
├── internal/
│   ├── consumer/
│   │   └── kafka.go
│   │
│   ├── deduplicator/
│   │   └── redis_dedup.go              ← SET NX with 30-day TTL per alert fingerprint
│   │
│   ├── scorer/
│   │   └── severity.go                 ← Maps risk_score → severity label
│   │
│   ├── store/
│   │   ├── postgres.go                 ← Persist alert to PostgreSQL
│   │   └── elasticsearch.go            ← Index alert in breach_events
│   │
│   ├── publisher/
│   │   ├── kafka.go                    ← Publish to alerts.confirmed
│   │   └── redis_pubsub.go             ← Publish to ws_channel:{org_id} for WebSocket
│   │
│   └── config/
│       └── config.go
│
└── tests/
    ├── unit/
    │   ├── deduplicator_test.go
    │   └── severity_test.go
    └── integration/
        └── alert_lifecycle_test.go
```

---

### 3.6 `services/notification/` — Node.js 22 / TypeScript

Consumes `alerts.confirmed`, looks up org integrations, and dispatches to all configured channels.

```
services/notification/
│
├── Dockerfile
├── package.json
├── tsconfig.json
│
├── src/
│   ├── index.ts                        ← Entry point
│   ├── consumer/
│   │   └── kafka-consumer.ts
│   │
│   ├── dispatchers/
│   │   ├── base-dispatcher.ts          ← Abstract base class
│   │   ├── email-dispatcher.ts         ← AWS SES / SendGrid
│   │   ├── slack-dispatcher.ts         ← Slack Block Kit
│   │   ├── teams-dispatcher.ts         ← MS Teams Adaptive Cards
│   │   ├── webhook-dispatcher.ts       ← HMAC-signed HTTPS POST
│   │   ├── pagerduty-dispatcher.ts     ← PagerDuty Events API v2
│   │   ├── jira-dispatcher.ts          ← Jira REST API v3 ticket creation
│   │   └── servicenow-dispatcher.ts    ← ServiceNow REST API
│   │
│   ├── templates/
│   │   ├── email/
│   │   │   ├── alert-critical.html     ← Responsive HTML email templates
│   │   │   ├── alert-high.html
│   │   │   ├── alert-medium.html
│   │   │   └── weekly-digest.html
│   │   └── slack/
│   │       └── alert-block-kit.ts      ← Block Kit builder
│   │
│   ├── retry/
│   │   └── delivery-queue.ts           ← Exponential backoff retry logic
│   │
│   ├── db/
│   │   └── postgres.ts                 ← Fetch org integrations
│   │
│   └── config.ts
│
└── tests/
    ├── unit/
    │   ├── slack-dispatcher.test.ts
    │   ├── webhook-dispatcher.test.ts
    │   └── hmac-signature.test.ts
    └── integration/
        └── email-delivery.test.ts
```

---

### 3.7 `services/identity/` — Node.js 22 / NestJS

Auth, RBAC, user management, API key management, org settings, billing webhooks.

```
services/identity/
│
├── Dockerfile
├── package.json
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts             ← Login, JWT issue, API key validation
│   │   ├── jwt.strategy.ts             ← Passport JWT strategy
│   │   ├── api-key.strategy.ts         ← API key validation via SHA-256 lookup
│   │   ├── mfa/
│   │   │   ├── totp.service.ts         ← TOTP generation/validation
│   │   │   └── mfa.controller.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       ├── api-key.guard.ts
│   │       └── roles.guard.ts          ← RBAC enforcement
│   │
│   ├── organizations/
│   │   ├── org.module.ts
│   │   ├── org.service.ts
│   │   ├── org.controller.ts
│   │   └── dto/
│   │       ├── create-org.dto.ts
│   │       └── update-org.dto.ts
│   │
│   ├── users/
│   │   ├── user.module.ts
│   │   ├── user.service.ts
│   │   ├── user.controller.ts
│   │   └── dto/
│   │
│   ├── api-keys/
│   │   ├── api-key.module.ts
│   │   ├── api-key.service.ts          ← Key generation (CSPRNG), hash storage
│   │   └── api-key.controller.ts
│   │
│   ├── billing/
│   │   ├── billing.module.ts
│   │   ├── stripe.service.ts           ← Stripe API client
│   │   ├── webhook.controller.ts       ← Stripe webhook handler
│   │   └── subscription.service.ts
│   │
│   ├── audit/
│   │   └── audit.service.ts            ← Write-only audit log writer
│   │
│   └── database/
│       └── prisma.service.ts           ← Prisma ORM client (PostgreSQL)
│
└── tests/
    ├── unit/
    │   ├── auth.service.spec.ts
    │   ├── api-key.service.spec.ts
    │   └── stripe.service.spec.ts
    └── e2e/
        └── auth.e2e-spec.ts
```

---

### 3.8 `services/dashboard-bff/` — Node.js 22 / NestJS

Backend-for-Frontend: aggregates data from internal services, manages WebSocket connections, and serves the dashboard app.

```
services/dashboard-bff/
│
├── Dockerfile
├── package.json
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── alerts/
│   │   ├── alerts.module.ts
│   │   ├── alerts.service.ts           ← Fetch + aggregate from PostgreSQL + Elasticsearch
│   │   ├── alerts.controller.ts
│   │   └── alerts.gateway.ts           ← WebSocket gateway (Socket.io)
│   │
│   ├── watchlist/
│   │   ├── watchlist.module.ts
│   │   ├── watchlist.service.ts
│   │   └── watchlist.controller.ts
│   │
│   ├── stats/
│   │   ├── stats.module.ts
│   │   ├── stats.service.ts            ← ClickHouse queries for dashboard KPI cards
│   │   └── stats.controller.ts
│   │
│   ├── reports/
│   │   ├── reports.module.ts
│   │   ├── reports.service.ts          ← Trigger report generation, poll status
│   │   └── reports.controller.ts
│   │
│   ├── threat-graph/
│   │   ├── threat-graph.module.ts
│   │   └── threat-graph.service.ts     ← Graph data aggregation for 3D visualization
│   │
│   ├── realtime/
│   │   └── redis-subscriber.service.ts ← Subscribe to Redis ws_channel:{org_id}
│   │
│   └── database/
│       ├── prisma.service.ts
│       ├── elasticsearch.service.ts
│       └── clickhouse.service.ts
│
└── tests/
```

---

## 4. apps/ — User-Facing Applications

### 4.1 `apps/web/` — Next.js 15 / React 19

The main web dashboard and marketing site.

```
apps/web/
│
├── Dockerfile
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
│
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── fonts/                          ← Self-hosted Inter/Outfit variable fonts
│
├── src/
│   ├── app/                            ← Next.js App Router
│   │   ├── layout.tsx                  ← Root layout (fonts, metadata, providers)
│   │   ├── page.tsx                    ← Marketing landing page (SSG)
│   │   │
│   │   ├── (auth)/                     ← Auth group (no sidebar)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── onboarding/
│   │   │       ├── layout.tsx          ← Multi-step wizard layout
│   │   │       ├── [step]/
│   │   │       │   └── page.tsx
│   │   │       └── complete/
│   │   │           └── page.tsx
│   │   │
│   │   ├── (dashboard)/                ← Protected dashboard group
│   │   │   ├── layout.tsx              ← Dashboard shell (sidebar, top nav)
│   │   │   ├── overview/
│   │   │   │   └── page.tsx            ← KPI cards, alert feed, activity chart
│   │   │   ├── alerts/
│   │   │   │   ├── page.tsx            ← Alert list with filters
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx        ← Alert detail: AI summary, timeline, actions
│   │   │   ├── watchlist/
│   │   │   │   └── page.tsx
│   │   │   ├── threat-graph/
│   │   │   │   └── page.tsx            ← Three.js 3D threat intelligence graph
│   │   │   ├── threat-actors/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── integrations/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── team/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── api-keys/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── billing/
│   │   │   │       └── page.tsx
│   │   │   └── mssp/                   ← Multi-tenant MSSP workspace
│   │   │       ├── page.tsx
│   │   │       └── [client_org_id]/
│   │   │           └── page.tsx
│   │   │
│   │   └── api/                        ← Next.js API routes (thin BFF proxies)
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts        ← NextAuth.js handler
│   │       └── health/
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                         ← Primitive components (wrapping Radix UI)
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Tooltip.tsx
│   │   │
│   │   ├── alerts/
│   │   │   ├── AlertCard.tsx
│   │   │   ├── AlertDetailPanel.tsx
│   │   │   ├── AlertFeed.tsx
│   │   │   ├── AlertStatusBadge.tsx
│   │   │   ├── SeverityIndicator.tsx
│   │   │   └── AISummaryBlock.tsx
│   │   │
│   │   ├── threat-graph/
│   │   │   ├── ThreatGraph.tsx         ← Three.js canvas wrapper
│   │   │   ├── GraphControls.tsx
│   │   │   ├── NodeTooltip.tsx
│   │   │   └── graph-utils.ts          ← Force-directed layout helpers
│   │   │
│   │   ├── dashboard/
│   │   │   ├── KPICard.tsx
│   │   │   ├── AlertTrendChart.tsx     ← Recharts
│   │   │   ├── SourceBreakdownChart.tsx
│   │   │   └── CoverageMap.tsx
│   │   │
│   │   ├── watchlist/
│   │   │   ├── WatchlistTable.tsx
│   │   │   ├── AddAssetModal.tsx
│   │   │   └── VerificationStatus.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopNav.tsx
│   │   │   ├── NotificationBell.tsx    ← Real-time WebSocket alert badge
│   │   │   └── OrgSwitcher.tsx         ← MSSP org switcher
│   │   │
│   │   └── marketing/
│   │       ├── HeroSection.tsx
│   │       ├── PricingTable.tsx
│   │       ├── ComparisonTable.tsx
│   │       └── TestimonialCarousel.tsx
│   │
│   ├── hooks/
│   │   ├── useAlerts.ts                ← TanStack Query + WebSocket sync
│   │   ├── useWatchlist.ts
│   │   ├── useWebSocket.ts             ← WebSocket connection manager
│   │   ├── useOrg.ts
│   │   └── useThreatGraph.ts
│   │
│   ├── stores/                         ← Zustand global stores
│   │   ├── authStore.ts
│   │   ├── alertStore.ts
│   │   ├── watchlistStore.ts
│   │   ├── uiStore.ts
│   │   └── threatGraphStore.ts
│   │
│   ├── lib/
│   │   ├── api-client.ts               ← Typed HTTP client wrapping fetch
│   │   ├── auth.ts                     ← NextAuth config
│   │   ├── cn.ts                       ← clsx + tailwind-merge utility
│   │   ├── format.ts                   ← Date, number, severity formatters
│   │   └── validators.ts               ← Zod schemas for form validation
│   │
│   └── styles/
│       └── globals.css                 ← Tailwind base + design tokens (CSS variables)
│
├── tests/
│   ├── unit/
│   │   ├── AlertCard.test.tsx
│   │   └── format.test.ts
│   └── e2e/                            ← Playwright tests
│       ├── onboarding.spec.ts
│       ├── alert-triage.spec.ts
│       └── watchlist.spec.ts
│
└── .env.local.example
```

---

### 4.2 `apps/mobile/` — React Native / Expo (Phase 4)

```
apps/mobile/
│
├── app.json                            ← Expo config
├── package.json
│
├── src/
│   ├── app/                            ← Expo Router file-based routing
│   │   ├── (tabs)/
│   │   │   ├── index.tsx               ← Alert feed
│   │   │   ├── watchlist.tsx
│   │   │   └── settings.tsx
│   │   └── alerts/
│   │       └── [id].tsx
│   │
│   ├── components/
│   ├── hooks/
│   ├── stores/
│   └── lib/
│
└── assets/
```

---

## 5. shared/ — Cross-Service Libraries

```
shared/
│
├── proto/                              ← gRPC protobuf definitions (source of truth)
│   ├── notification/
│   │   └── v1/
│   │       └── notification.proto
│   ├── matcher/
│   │   └── v1/
│   │       └── matcher.proto
│   ├── identity/
│   │   └── v1/
│   │       └── identity.proto
│   ├── bff/
│   │   └── v1/
│   │       └── dashboard.proto
│   └── gen/                            ← Generated stubs (committed, not hand-edited)
│       ├── python/
│       ├── go/
│       └── node/
│
├── avro-schemas/                       ← Kafka Avro schema definitions
│   ├── raw_event_v1.avsc
│   ├── processed_event_v1.avsc
│   ├── alert_candidate_v1.avsc
│   ├── confirmed_alert_v1.avsc
│   └── audit_event_v1.avsc
│
├── libs/
│   ├── python/
│   │   └── umbra-common/               ← Shared Python library (published to internal PyPI)
│   │       ├── pyproject.toml
│   │       └── src/
│   │           └── umbra_common/
│   │               ├── logging.py      ← Structured JSON logger (structlog)
│   │               ├── tracing.py      ← OpenTelemetry setup
│   │               ├── crypto.py       ← SHA-256 helpers, HMAC utilities
│   │               ├── kafka.py        ← Kafka producer/consumer factory
│   │               └── vault.py        ← HashiCorp Vault client wrapper
│   │
│   ├── go/
│   │   └── umbra-common/               ← Shared Go module
│   │       ├── go.mod
│   │       └── pkg/
│   │           ├── logging/
│   │           ├── tracing/
│   │           ├── crypto/
│   │           └── kafka/
│   │
│   └── node/
│       └── umbra-common/               ← Shared TypeScript library (pnpm workspace)
│           ├── package.json
│           └── src/
│               ├── logger.ts
│               ├── tracing.ts
│               ├── crypto.ts
│               └── kafka.ts
│
└── database/
    ├── migrations/                     ← PostgreSQL migrations (golang-migrate)
    │   ├── 0001_initial_schema.up.sql
    │   ├── 0001_initial_schema.down.sql
    │   └── ...
    ├── seeds/                          ← Dev/test data seeds
    │   ├── seed_orgs.sql
    │   └── seed_test_alerts.sql
    └── prisma/
        └── schema.prisma               ← Prisma schema (used by identity + bff services)
```

---

## 6. infra/ — Infrastructure as Code

```
infra/
│
├── terraform/                          ← AWS infrastructure (Terraform)
│   ├── modules/
│   │   ├── eks/                        ← EKS cluster module
│   │   ├── rds/                        ← RDS PostgreSQL module
│   │   ├── elasticache/                ← ElastiCache Redis module
│   │   ├── msk/                        ← Amazon MSK (Kafka) module
│   │   ├── s3/                         ← S3 buckets + lifecycle policies
│   │   ├── vpc/                        ← VPC, subnets, security groups
│   │   └── iam/                        ← IAM roles for service accounts
│   │
│   ├── environments/
│   │   ├── staging/
│   │   │   └── main.tf
│   │   └── production/
│   │       ├── main.tf
│   │       └── backend.tf
│   │
│   └── shared/
│       └── variables.tf
│
├── k8s/                                ← Raw Kubernetes manifests (Helm-managed)
│   └── namespaces/
│       ├── collection.yaml
│       ├── intelligence.yaml
│       ├── delivery.yaml
│       ├── data.yaml
│       └── frontend.yaml
│
├── helm/                               ← Helm charts per service
│   ├── Chart.yaml                      ← Umbrella chart
│   ├── values.yaml                     ← Default values
│   ├── values.staging.yaml
│   ├── values.production.yaml
│   └── templates/
│       ├── collector-deployment.yaml
│       ├── processor-deployment.yaml
│       ├── intelligence-deployment.yaml
│       ├── matcher-deployment.yaml
│       ├── alert-engine-deployment.yaml
│       ├── notification-deployment.yaml
│       ├── identity-deployment.yaml
│       ├── dashboard-bff-deployment.yaml
│       └── web-deployment.yaml
│
├── monitoring/
│   ├── grafana/
│   │   └── dashboards/
│   │       ├── system-health.json
│   │       ├── collection-pipeline.json
│   │       ├── alert-engine.json
│   │       └── business-metrics.json
│   └── prometheus/
│       └── rules/
│           ├── alert-engine.yml
│           └── api-gateway.yml
│
└── vault/
    ├── policies/
    │   ├── collector-policy.hcl
    │   └── intelligence-policy.hcl
    └── secrets-layout.md              ← Map of Vault secret paths per service
```

---

## 7. docs/ — Documentation

```
docs/
├── PRD.md                              ← Product Requirements Document
├── Design.md                          ← Visual & interaction design spec
├── Architecture.md                    ← System architecture (ADD)
├── TechStack.md                       ← Technology choices and versions
├── Requirements.md                    ← Functional & non-functional requirements
├── Mobile-Responsiveness.md           ← Mobile & responsive design spec
├── API.md                             ← REST API reference
├── Database.md                        ← Database schema & design
├── Contracts.md                       ← Service interface contracts
├── ProjectStructure.md                ← This document
└── Roadmap.md                         ← Development roadmap & milestones
```

---

## 8. scripts/ — Developer Tooling

```
scripts/
│
├── setup-dev.sh                        ← One-command dev environment bootstrap
├── generate-protos.sh                  ← Regenerate gRPC stubs from .proto files
├── migrate.sh                          ← Run pending database migrations
├── seed-db.sh                          ← Seed local dev database
├── test-all.sh                         ← Run full test suite across all services
├── build-all.sh                        ← Build all Docker images
├── schema-compat-check.sh              ← Check Avro schema backward compatibility
│
├── ml/
│   ├── retrain-risk-model.py           ← XGBoost model retraining script
│   └── evaluate-model.py               ← Model evaluation + metrics report
│
└── data/
    ├── generate-synthetic-events.py    ← Generate synthetic breach events for testing
    └── import-hibp-dump.py             ← One-time HIBP data import utility
```

**Common `make` commands:**

```makefile
make dev           # Start full docker-compose local stack
make test          # Run all unit tests
make test-e2e      # Run Playwright E2E tests against local stack
make migrate       # Run pending database migrations
make proto         # Regenerate gRPC stubs
make lint          # Lint all services (Ruff + ESLint + golangci-lint)
make build         # Build all Docker images
make seed          # Seed local dev database
make logs          # Tail logs from all local containers
```

---

## 9. Module Ownership Map

| Directory | Owning Team | Primary Language |
|---|---|---|
| `services/collector/` | Data Engineering | Python |
| `services/processor/` | Data Engineering | Python |
| `services/intelligence/` | ML / AI Team | Python |
| `services/matcher/` | Core Platform | Go |
| `services/alert-engine/` | Core Platform | Go |
| `services/notification/` | Integrations Team | TypeScript |
| `services/identity/` | Platform / Auth Team | TypeScript |
| `services/dashboard-bff/` | Platform / Auth Team | TypeScript |
| `apps/web/` | Frontend Team | TypeScript (React) |
| `apps/mobile/` | Mobile Team | TypeScript (React Native) |
| `shared/proto/` | Core Platform | — |
| `shared/avro-schemas/` | Data Engineering | — |
| `infra/` | DevOps / SRE | Terraform / YAML |
| `docs/` | All Teams (shared) | Markdown |

CODEOWNERS file enforces review requirements — changes to any service require approval from the owning team.

---

## 10. Naming Conventions

### Files & Directories

| Context | Convention | Example |
|---|---|---|
| Python files | `snake_case.py` | `risk_scorer.py` |
| TypeScript/TSX files | `PascalCase.tsx` (components), `camelCase.ts` (utils) | `AlertCard.tsx`, `apiClient.ts` |
| Go files | `snake_case.go` | `domain_index.go` |
| Kubernetes manifests | `{service}-{resource}.yaml` | `collector-deployment.yaml` |
| Terraform modules | `snake_case/` | `eks/`, `rds/` |

### Database

| Context | Convention | Example |
|---|---|---|
| Table names | `snake_case`, plural | `organizations`, `watchlist_items` |
| Column names | `snake_case` | `org_id`, `detected_at` |
| Indexes | `idx_{table}_{columns}` | `idx_alerts_org_severity` |
| Migrations | `{number}_{description}.{up/down}.sql` | `0007_add_executive_monitoring.up.sql` |

### API

| Context | Convention | Example |
|---|---|---|
| URL paths | `kebab-case`, plural nouns | `/v1/watchlist-items`, `/v1/threat-actors` |
| JSON fields | `snake_case` | `detected_at`, `risk_score` |
| Resource IDs | `{type}_{ULID}` | `alert_01J8X4KC123` |
| Enum values | `snake_case` | `credential_breach`, `in_progress` |

### Kafka Topics

| Pattern | Example |
|---|---|
| `{domain}.{entity}.{event}` | `alerts.confirmed`, `raw.events` |
| DLQ: `dlq.{original_topic}` | `dlq.raw.events` |

---

## 11. Environment Configuration

Each service uses **Pydantic Settings** (Python), **`@nestjs/config`** (Node), or **`viper`** (Go) to load config from environment variables. No secrets are committed to the repository — all secrets are fetched from HashiCorp Vault at startup.

### Required Environment Variables (all services)

```bash
# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317
OTEL_SERVICE_NAME=umbra-collector

# Vault (secrets fetched at runtime)
VAULT_ADDR=https://vault.umbra-internal.io
VAULT_ROLE_ID=<role-id>
VAULT_SECRET_ID=<secret-id>

# Kafka
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
KAFKA_SCHEMA_REGISTRY_URL=http://schema-registry:8081

# PostgreSQL
DATABASE_URL=postgresql://umbra:${DB_PASSWORD}@postgres:5432/umbra

# Environment
APP_ENV=development   # development | staging | production
LOG_LEVEL=info
```

### `.env.local.example` (web app)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8081
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

---

## 12. Local Development Setup

### Prerequisites

- Docker Desktop 4.x+
- Node.js 22 LTS + pnpm
- Python 3.12 + uv
- Go 1.23
- `make`

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/umbra-intelligence/umbra-platform.git
cd umbra-platform

# 2. Bootstrap dev environment (installs dependencies, sets up .env files)
make setup

# 3. Start all services + datastores
make dev

# 4. Seed database with test data
make seed

# 5. Open dashboard
open http://localhost:3000
# Default login: admin@umbra-dev.local / devpassword123
```

### Service Ports (local)

| Service | Port |
|---|---|
| Web Dashboard (Next.js) | 3000 |
| API Gateway (Kong) | 8080 |
| Dashboard BFF (NestJS) | 8081 |
| Identity Service | 8082 |
| Notification Service | 8083 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Kafka | 9092 |
| Elasticsearch | 9200 |
| ClickHouse | 8123 |
| Schema Registry | 8089 |
| Grafana | 3001 |
| Jaeger UI | 16686 |

---

*Document maintained by: Hardik Bhaskar | UMBRA Intelligence | Project Structure v1.0.0*

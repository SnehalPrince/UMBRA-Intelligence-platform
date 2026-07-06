# UMBRA — Technology Stack

**Version:** 1.0.0
**Author:** Hardik Bhaskar
**Status:** Draft → Review
**Last Updated:** June 2026

---

## Table of Contents
1. [Stack Philosophy](#1-stack-philosophy)
2. [Frontend Stack](#2-frontend-stack)
3. [Backend & Microservices Stack](#3-backend--microservices-stack)
4. [AI / ML Stack](#4-ai--ml-stack)
5. [Data Collection Stack](#5-data-collection-stack)
6. [Data Storage Stack](#6-data-storage-stack)
7. [Infrastructure & DevOps Stack](#7-infrastructure--devops-stack)
8. [Observability Stack](#8-observability-stack)
9. [Third-Party Services](#9-third-party-services)
10. [Version Matrix](#10-version-matrix)

---

## 1. Stack Philosophy

Choices optimize for: **streaming-first data flow, polyglot services where the language fits the job** (Python for ML/crawling, Node/TypeScript for API & BFF, Go for high-throughput matching), and **boring, battle-tested infra** underneath a genuinely novel product surface (the 3D threat graph, AI enrichment).

---

## 2. Frontend Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR for marketing/SEO, CSR for the live dashboard, one codebase |
| UI Library | **React 19** | Concurrent rendering for real-time alert streams |
| Styling | **Tailwind CSS 4** | Token-driven design system (`Design.md` §3), fast iteration |
| Component Primitives | **Radix UI** | Accessible, unstyled — fits the custom design system |
| 3D / WebGL | **Three.js + React Three Fiber** | Threat Graph (`Architecture.md` C1, `Design.md` §6) |
| State Management | **Zustand** | Lightweight, slices map cleanly to domain stores (`Architecture.md` §9) |
| Data Fetching | **TanStack Query** | Cache + real-time invalidation alongside WebSocket pushes |
| Charts | **Recharts / D3** | KPI trend charts; D3 also powers the 2D graph fallback |
| Real-Time | **native WebSocket + Redis Pub/Sub bridge** | Sub-second alert delivery to open dashboards |
| Mobile App (Phase 4) | **React Native + Expo** | Code-sharing with web design tokens; push notifications for Critical alerts |

---

## 3. Backend & Microservices Stack

| Service | Language/Framework | Why |
|---|---|---|
| `collector` | **Python 3.12** (asyncio, `stem`, Telethon) | Best ecosystem for Tor/Telegram/crawling libraries |
| `processor` | **Python 3.12** (FastAPI workers) | Shares NLP/parsing libs with collector |
| `intelligence` | **Python 3.12** (PyTorch, XGBoost, Anthropic SDK) | ML/LLM-native ecosystem |
| `matcher` | **Go 1.23** | High-throughput, low-latency watchlist matching at Kafka-stream scale |
| `alert-engine` | **Go 1.23** | Same throughput requirement as matcher |
| `notification` | **Node.js 22 / TypeScript** | Rich SDKs for Slack, Teams, SendGrid, Jira |
| `api-gateway` | **Kong Gateway** (declarative config) | Auth/rate-limit plugins out of the box |
| `dashboard-bff` | **Node.js 22 / NestJS** | TypeScript parity with frontend; GraphQL-friendly if needed later |
| `identity` | **Node.js 22 / NestJS** | Auth, RBAC, org/billing logic |

**Inter-service:** gRPC (protobuf) for sync calls, Apache Kafka for event streaming, both per `Architecture.md` §3.

---

## 4. AI / ML Stack

| Component | Technology | Purpose |
|---|---|---|
| Content classification | **FastText + fine-tuned BERT** (HuggingFace) | Classify raw content type (credential dump / forum post / leak notice) |
| Credential extraction | **Regex + spaCy NER** | Structured extraction of email:pass pairs, tokens, keys |
| Deduplication | **MinHash LSH (datasketch)** | Near-duplicate detection across recompiled breach dumps |
| Risk scoring | **XGBoost** | Tabular model, fast inference, explainable feature weights (`Architecture.md` §5) |
| Threat summarization & remediation | **Claude (Anthropic API)** | LLM enrichment — human-readable summaries, MITRE mapping |
| MITRE ATT&CK mapping | **Rules engine + LLM-assisted tagging** | Hybrid: deterministic where possible, LLM for ambiguous cases |
| ML Ops | **MLflow** | Model versioning/tracking for XGBoost risk model retraining |

---

## 5. Data Collection Stack

| Component | Technology |
|---|---|
| Tor access | `stem` (Tor controller library) + SOCKS5 circuits |
| I2P access | I2P SAM proxy |
| Telegram | Telethon (MTProto client) |
| Paste sites / surface web | `httpx` + Playwright (for JS-rendered sites) |
| Proxy rotation | Residential proxy pool + Tor circuit rotation (15-min cycle) |
| Source feeds | HaveIBeenPwned API, MISP, AlienVault OTX |

---

## 6. Data Storage Stack

| Store | Technology | Purpose |
|---|---|---|
| Relational | **PostgreSQL 16** | Orgs, users, watchlists, billing, alerts |
| Search/Analytics | **Elasticsearch 8.x** | Breach event search, forum post index |
| Cache / Pub-Sub | **Redis 7** | Sessions, rate limits, WebSocket fan-out |
| Time-series | **ClickHouse** | Alert trend analytics, executive dashboards |
| Object storage | **AWS S3** | Raw archives, generated PDFs, WORM audit logs |
| Event streaming | **Apache Kafka** | Backbone for collector → processor → matcher → alert pipeline |

---

## 7. Infrastructure & DevOps Stack

| Layer | Technology |
|---|---|
| Cloud | **AWS** (`us-east-1` primary, `eu-west-1` GDPR) |
| Orchestration | **Kubernetes (EKS) 1.30** |
| Service Mesh | **Istio** (mTLS, traffic policy) |
| IaC | **Terraform** |
| Packaging | **Helm** |
| CI/CD | **GitHub Actions** → ECR → EKS (staging auto-deploy, prod manual approval) |
| Secrets | **HashiCorp Vault** |
| Edge / CDN / WAF | **Cloudflare** |
| Containerization | **Docker** |

---

## 8. Observability Stack

| Concern | Technology |
|---|---|
| Metrics | Prometheus + Grafana |
| Logs | Fluentd → OpenSearch |
| Tracing | OpenTelemetry → Jaeger |
| Alerting (on-call) | PagerDuty |
| Uptime | Checkly (10-region synthetic checks) |

---

## 9. Third-Party Services

| Service | Provider | Use |
|---|---|---|
| Billing | Stripe | Subscriptions, invoicing, overage metering |
| Email delivery | AWS SES / SendGrid | Transactional + digest emails |
| LLM API | Anthropic Claude API | Threat summarization & remediation generation |
| Error tracking | Sentry | Frontend + backend exception monitoring |
| Analytics (product) | PostHog | Funnel/onboarding analytics (self-hosted for data control) |

---

## 10. Version Matrix

| Component | Version |
|---|---|
| Next.js | 15.x |
| React | 19.x |
| Node.js | 22 LTS |
| Python | 3.12 |
| Go | 1.23 |
| PostgreSQL | 16 |
| Elasticsearch | 8.x |
| Redis | 7.x |
| Kafka | 3.7+ |
| Kubernetes | 1.30 |
| Three.js | r170+ |

---

*Document maintained by: Hardik Bhaskar | UMBRA Intelligence | TechStack v1.0.0*

# UMBRA — System Architecture

**Version:** 1.0.0  
**Author:** Hardik Bhaskar  
**Type:** Architecture Design Document (ADD)

---

## Table of Contents
1. [Architectural Philosophy](#1-architectural-philosophy)
2. [High-Level System Overview](#2-high-level-system-overview)
3. [Microservices Architecture](#3-microservices-architecture)
4. [Data Collection & Ingestion Pipeline](#4-data-collection--ingestion-pipeline)
5. [AI / ML Intelligence Pipeline](#5-ai--ml-intelligence-pipeline)
6. [Alert & Notification Engine](#6-alert--notification-engine)
7. [Storage Architecture](#7-storage-architecture)
8. [API Gateway Layer](#8-api-gateway-layer)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Security Architecture](#10-security-architecture)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [Observability & Monitoring](#12-observability--monitoring)
13. [Disaster Recovery & Resilience](#13-disaster-recovery--resilience)

---

## 1. Architectural Philosophy

UMBRA is built on five core architectural principles:

| Principle | Implementation |
|---|---|
| **Resilience First** | Every service is fault-tolerant; no SPOF in the data pipeline |
| **Data Freshness** | Streaming-first; minimize latency from collection to alert |
| **Zero Trust** | All service-to-service communication is mTLS; no implicit trust |
| **Privacy by Design** | Credential data is one-way hashed; raw PII never persisted long-term |
| **API First** | Every internal capability is accessible via the same API customers use |

---

## 2. High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UMBRA PLATFORM                              │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  DATA        │    │  INTELLIGENCE│    │  DELIVERY LAYER      │  │
│  │  COLLECTION  │───▶│  PIPELINE    │───▶│  (Alerts, API, UI)   │  │
│  │  LAYER       │    │  (AI + ML)   │    │                      │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│         │                   │                      │                │
│         ▼                   ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    DATA STORES                               │   │
│  │  PostgreSQL │ Elasticsearch │ Redis │ ClickHouse │ S3       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Network Perimeter

```
Internet
    │
    ▼
┌─────────────────────────────┐
│   Cloudflare (DDoS + WAF)   │
└─────────────┬───────────────┘
              │
    ┌─────────▼──────────┐
    │   API Gateway       │  (Kong / AWS API GW)
    │   Rate Limiting     │
    │   Auth Middleware   │
    └─────────┬──────────┘
              │
    ┌─────────▼──────────┐
    │   Load Balancer     │  (AWS ALB)
    └──────┬──────┬───────┘
           │      │
     ┌─────▼──┐ ┌─▼──────┐
     │  Web   │ │  API   │
     │  App   │ │  App   │
     └────────┘ └────────┘
```

---

## 3. Microservices Architecture

UMBRA uses a domain-driven microservices architecture with 9 core services:

```
umbra-platform/
├── services/
│   ├── collector/          ← Source crawling & data ingestion
│   ├── processor/          ← Data parsing, normalization, dedup
│   ├── intelligence/       ← AI/ML threat scoring and enrichment
│   ├── matcher/            ← Asset watchlist matching engine
│   ├── alert-engine/       ← Alert generation & routing
│   ├── notification/       ← Delivery: email, Slack, webhook
│   ├── api-gateway/        ← Public REST API
│   ├── dashboard-bff/      ← Backend-for-Frontend (web dashboard)
│   └── identity/           ← Auth, RBAC, org management
├── shared/
│   ├── proto/              ← gRPC protobuf definitions
│   ├── events/             ← Kafka event schemas (Avro)
│   └── libs/               ← Shared utilities (logging, crypto, etc.)
└── infra/
    ├── k8s/                ← Kubernetes manifests
    ├── terraform/          ← Infrastructure as Code
    └── helm/               ← Helm charts
```

### Service Interaction Map

```
                    ┌───────────────┐
                    │   COLLECTOR   │
                    │   SERVICE     │
                    └───────┬───────┘
                            │ Kafka: raw.events
                            ▼
                    ┌───────────────┐
                    │   PROCESSOR   │ ←── Normalize, deduplicate,
                    │   SERVICE     │     hash credentials
                    └───────┬───────┘
                            │ Kafka: processed.events
               ┌────────────┼────────────┐
               ▼            ▼            ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │INTELLIGENCE│ │ MATCHER  │  │   STORE  │
       │ SERVICE  │  │ SERVICE  │  │(Elastic) │
       └────┬─────┘  └────┬─────┘  └──────────┘
            │             │
            └──────┬───────┘
                   │ Kafka: alert.candidates
                   ▼
           ┌───────────────┐
           │  ALERT ENGINE │
           └───────┬───────┘
                   │ Kafka: alerts.confirmed
                   ▼
           ┌───────────────┐
           │ NOTIFICATION  │ ──▶ Email / Slack / Teams / Webhook
           │   SERVICE     │
           └───────────────┘
```

### Inter-Service Communication

| Type | Protocol | Use Case |
|---|---|---|
| Async event streaming | Apache Kafka | Collector → Processor → Matcher |
| Sync internal API | gRPC (mTLS) | Alert Engine ↔ Notification, API GW ↔ BFF |
| Sync external API | REST/HTTPS | Public API, webhooks, third-party integrations |
| Pub/Sub | Redis Pub/Sub | Real-time dashboard WebSocket updates |

---

## 4. Data Collection & Ingestion Pipeline

### Source Coverage Map

```
COLLECTION TARGETS
├── Underground Networks
│   ├── Tor Hidden Services (.onion)
│   │   ├── Ransomware Leak Sites (200+)
│   │   ├── Dark Marketplaces (credential trading)
│   │   └── Hacker Forums (XSS, Exploit.in, etc.)
│   ├── I2P Network (eepsites)
│   └── ZeroNet Sites
│
├── Messaging Platforms
│   ├── Telegram Channels & Groups (infostealer dumps, combolists)
│   └── Discord Servers (via invite-based monitoring)
│
├── Surface Web Sources
│   ├── Paste Sites (Pastebin, GitHub Gist, Ghostbin, 0bin, 50+)
│   ├── Public Code Repositories (GitHub, GitLab secret scanning)
│   └── Ransomware Blogs (clear-web mirror sites)
│
└── Data Feeds (Aggregated)
    ├── Third-party breach intelligence APIs
    ├── Community breach databases (HaveIBeenPwned API integration)
    └── Open-source threat feeds (MISP, OTX)
```

### Collector Service Architecture

```python
# Conceptual Collector Service Flow

class CollectorOrchestrator:
    """
    Manages a pool of specialized collectors, each
    targeting a category of sources. Runs on separate
    worker nodes with anonymizing proxy routing.
    """
    collectors = [
        TorCollector(proxy=TorSOCKS5Proxy()),     # .onion sites
        TelegramCollector(api=TelegramMTProto()),  # Telegram channels
        PasteSiteCollector(sites=PASTE_SITE_LIST), # Paste sites
        GitCollector(tokens=GITHUB_TOKENS),        # Public repos
        I2PCollector(proxy=I2PProxy()),            # I2P eepsites
        DataFeedCollector(feeds=EXTERNAL_FEEDS),   # Third-party feeds
    ]
    
    async def run_collection_cycle(self):
        tasks = [c.collect_and_publish() for c in self.collectors]
        await asyncio.gather(*tasks, return_exceptions=True)
```

### Proxy & Anonymization Layer

```
Collector Workers
      │
      ▼
┌──────────────────────────────────┐
│   Rotating Proxy Pool            │
│   ├── Tor SOCKS5 (port 9050)     │
│   ├── Residential Proxy Rotation │
│   └── Exit Node Management       │
└──────────────────────────────────┘
      │
      ▼
Target Sources (Dark/Surface Web)
```

- Tor requests route via `stem` library (Python Tor controller)
- Each collector uses circuit rotation every 15 minutes
- Fingerprint randomization: random `User-Agent`, `Accept-Language`, delays
- Rate limiting per target to avoid detection and respect crawl ethics

### Ingestion Schema (Kafka Event)

```json
{
  "event_id": "evt_01J8X4K9M3QVPN2T",
  "source_type": "telegram_channel",
  "source_id": "channel_12345",
  "collected_at": "2026-06-15T14:23:11Z",
  "content_type": "credential_dump",
  "raw_content_hash": "sha256:abc123...",
  "content_size_bytes": 45230,
  "metadata": {
    "channel_name": "combolists_2026",
    "post_id": "9823",
    "language": "ru"
  },
  "collector_version": "2.1.0"
}
```

---

## 5. AI / ML Intelligence Pipeline

### Intelligence Flow

```
Raw Event
    │
    ▼
┌──────────────────────┐
│  Content Classifier  │ ← Is this credential data? Forum post?
│  (FastText + BERT)   │   Ransomware listing? Code secret?
└──────────┬───────────┘
           │
    ┌──────▼───────────┐
    │  Credential      │
    │  Extractor       │ ← Regex + ML: extract email:pass pairs,
    │                  │   hashes, tokens, API keys
    └──────┬───────────┘
           │
    ┌──────▼───────────┐
    │  Deduplication   │ ← MinHash LSH: skip already-seen content
    │  Engine          │   Timestamp normalization
    └──────┬───────────┘
           │
    ┌──────▼───────────┐
    │  Hash & Sanitize │ ← SHA-256 hash email, partial-mask password
    │                  │   for storage (never store plaintext PII)
    └──────┬───────────┘
           │
    ┌──────▼───────────┐
    │  Risk Scorer     │ ← ML model: source freshness, recency,
    │  (XGBoost)       │   domain sensitivity, volume
    └──────┬───────────┘
           │
    ┌──────▼───────────┐
    │  LLM Enrichment  │ ← Claude/GPT: generate human-readable
    │  (Context Gen.)  │   summary + remediation playbook
    └──────┬───────────┘
           │
    ┌──────▼───────────┐
    │  MITRE ATT&CK    │ ← Map to relevant ATT&CK techniques
    │  Mapper          │   (T1078: Valid Accounts, etc.)
    └──────────────────┘
```

### Risk Scoring Model

```
Risk Score (0–100) = weighted combination of:

  Source Freshness Weight    (30%) — hours since credential harvested
  Source Tier Weight         (25%) — Tier 1=Telegram/fresh logs > Tier 2=forums > Tier 3=old breaches
  Domain Sensitivity         (20%) — finance/healthcare domains score higher
  Credential Type            (15%) — admin/root/VPN creds > standard user
  Breach Volume              (10%) — more records = higher urgency
```

### LLM Enrichment Prompt Pattern

```
System: You are a senior threat intelligence analyst at a cybersecurity firm.
        You analyze breach and dark web intelligence findings and produce 
        clear, actionable summaries for security teams.

User: Analyze this threat finding and provide:
      1. A 2-sentence plain-English summary of the threat
      2. Estimated severity (Critical/High/Medium/Low) with reasoning
      3. Three specific remediation steps in priority order
      4. Any relevant MITRE ATT&CK techniques

      Finding: {finding_json}
```

---

## 6. Alert & Notification Engine

### Alert Lifecycle

```
ALERT LIFECYCLE

[Candidate]  →  [Deduplicated]  →  [Scored]  →  [Matched]  →  [Delivered]
                                                      │
                                              Asset Watchlist DB
                                              (org domains, emails,
                                               keywords, IP ranges)
```

### Matching Logic

```python
class AssetMatcher:
    """
    Core matching engine: checks if a processed event
    matches any monitored organization's asset watchlist.
    Runs as a Kafka Streams application for real-time throughput.
    """
    
    def match(self, event: ProcessedEvent) -> list[Match]:
        matches = []
        
        # Exact domain match on extracted email domains
        for email_hash in event.credential_hashes:
            orgs = self.domain_index.lookup(email_hash.domain)
            matches.extend([(org, email_hash) for org in orgs])
        
        # Keyword matching for forum posts / brand mentions
        for keyword in event.extracted_keywords:
            orgs = self.keyword_index.lookup(keyword)
            matches.extend([(org, keyword) for org in orgs])
        
        return self.deduplicate(matches)
```

### Notification Channels

| Channel | SLA | Delivery Method |
|---|---|---|
| Email | < 5 min | AWS SES / SendGrid |
| Slack | < 2 min | Slack Bot API (Block Kit) |
| Microsoft Teams | < 2 min | Adaptive Cards webhook |
| Webhook | < 1 min | HTTPS POST with HMAC-SHA256 sig |
| PagerDuty | < 1 min | PagerDuty Events API v2 |
| JIRA | < 5 min | Jira REST API v3 |
| ServiceNow | < 5 min | ServiceNow REST API |

---

## 7. Storage Architecture

### Database Topology

```
┌─────────────────────────────────────────────────────┐
│                  STORAGE LAYER                       │
│                                                      │
│  ┌──────────────┐  ┌────────────────────────────┐   │
│  │  PostgreSQL  │  │     Elasticsearch 8.x      │   │
│  │  (Primary)   │  │    (Search & Analytics)    │   │
│  │              │  │                            │   │
│  │  ─ Orgs      │  │  ─ Breach events index     │   │
│  │  ─ Users     │  │  ─ Forum post index        │   │
│  │  ─ Watchlists│  │  ─ Full-text search        │   │
│  │  ─ Alerts    │  │  ─ Threat intelligence KB  │   │
│  │  ─ Billing   │  │                            │   │
│  └──────────────┘  └────────────────────────────┘   │
│                                                      │
│  ┌──────────────┐  ┌────────────────────────────┐   │
│  │    Redis 7   │  │       ClickHouse           │   │
│  │   (Cache &   │  │   (Time-Series Analytics)  │   │
│  │   Pub/Sub)   │  │                            │   │
│  │              │  │  ─ Alert trends over time  │   │
│  │  ─ Sessions  │  │  ─ Source statistics       │   │
│  │  ─ Rate limits│  │  ─ Risk score history     │   │
│  │  ─ WS events │  │  ─ Executive dashboards    │   │
│  └──────────────┘  └────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │           AWS S3 / Object Storage            │    │
│  │  ─ Raw event archives (encrypted)            │    │
│  │  ─ Generated threat report PDFs              │    │
│  │  ─ Audit logs (immutable, WORM bucket)       │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Data Retention Policy

| Data Type | Retention | Storage | Encryption |
|---|---|---|---|
| Raw crawled content | 30 days | S3 (cold) | AES-256 |
| Processed breach events | 2 years | Elasticsearch | AES-256 |
| Alert records | 5 years | PostgreSQL | AES-256 |
| Audit logs | 7 years | S3 WORM | AES-256 |
| Plaintext credentials | **Never stored** | — | — |
| Hashed credential fingerprints | 3 years | PostgreSQL | AES-256 |

---

## 8. API Gateway Layer

### Request Flow

```
Client
  │
  ▼
Cloudflare (TLS, DDoS)
  │
  ▼
Kong API Gateway
  ├── JWT / API Key Auth Plugin
  ├── Rate Limiting Plugin (per org, per endpoint)
  ├── Request Logging (Kafka)
  ├── IP Allowlist (Enterprise tier)
  └── CORS Plugin
  │
  ▼
Backend Services (via internal service mesh)
```

### API Versioning Strategy
- URL path versioning: `/api/v1/`, `/api/v2/`
- Breaking changes trigger version bump
- Each version maintained for minimum 18 months
- Deprecation notices via response headers: `Sunset: <date>`

---

## 9. Frontend Architecture

### Rendering Strategy

| Page Type | Strategy | Reason |
|---|---|---|
| Dashboard (real-time) | CSR (React) | Live updates via WebSocket |
| Marketing / Docs | SSG (Next.js) | SEO + performance |
| Org Setup Wizard | CSR (React) | Heavy interactivity |
| Report Pages | SSR (Next.js) | Data freshness + SEO |
| 3D Threat Graph | CSR (React + Three.js) | WebGL requires client |

### State Management

```
Zustand Global Store
├── authStore        ─ User session, org context, permissions
├── alertStore       ─ Real-time alert feed (WebSocket-synced)
├── watchlistStore   ─ Current org's monitored assets
├── uiStore          ─ Theme, sidebar state, modal state
└── threatGraphStore ─ 3D graph data, camera position, filters
```

### Real-Time Data Flow (WebSocket)

```
Dashboard UI
    │
    │ WebSocket (wss://app.umbra.io/ws)
    │
    ▼
Dashboard BFF Service
    │
    │ Redis Pub/Sub Subscribe
    │
    ▼
Alert Engine → [Kafka] → Notification Service → Redis Publish
```

---

## 10. Security Architecture

### Defense in Depth

```
Layer 0: Network     — Cloudflare WAF, DDoS protection, IP reputation
Layer 1: Perimeter   — API Gateway auth, rate limiting, request validation
Layer 2: Application — JWT validation, RBAC, input sanitization, OWASP Top 10
Layer 3: Service     — mTLS between all microservices, service mesh (Istio)
Layer 4: Data        — Encryption at rest (AES-256), in transit (TLS 1.3)
Layer 5: Secrets     — HashiCorp Vault for all secrets; no env var secrets
Layer 6: Audit       — Immutable audit trail for all data access and changes
```

### Credential Data Handling (Privacy by Design)

```
Raw credential found:
  user@company.com : P@ssw0rd123!

Stored in UMBRA:
  email_hash:    sha256("user@company.com") = 0a7f...
  email_domain:  "company.com"
  password_hint: "P***w0rd12*!" (partial mask, 4 chars shown)
  breach_source: "telegram_combolist_id_4432"
  found_at:      "2026-06-15T14:23:00Z"
  
NEVER stored:
  - Full plaintext email (only domain + hash)
  - Full plaintext password (only masked hint)
  - User's real name or other PII from the breach
```

### Access Control Model (RBAC)

| Role | Permissions |
|---|---|
| `org:owner` | Full access including billing, user management, API key admin |
| `org:admin` | All security operations; no billing access |
| `org:analyst` | View alerts, run searches, export reports |
| `org:viewer` | Read-only dashboard access |
| `api:read` | API key with read-only scope |
| `api:write` | API key with watchlist management scope |

---

## 11. Infrastructure & Deployment

### Cloud Architecture (AWS Primary)

```
AWS Region: us-east-1 (Primary) + eu-west-1 (EU GDPR)
                   │
         ┌─────────┴──────────┐
         │                    │
   ┌─────▼──────┐      ┌──────▼──────┐
   │  AZ-1      │      │   AZ-2       │
   │  (us-east) │      │  (us-east)   │
   └─────┬──────┘      └──────┬───────┘
         │                    │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────┐
         │  EKS Cluster        │
         │  (Kubernetes 1.30)  │
         └────────────────────┘
```

### Kubernetes Workload Distribution

```
umbra-platform (EKS)
├── Namespace: collection
│   ├── collector-deployment         (3–10 replicas, auto-scale)
│   └── processor-deployment         (3–8 replicas)
│
├── Namespace: intelligence
│   ├── intelligence-deployment      (2–6 replicas, GPU nodes)
│   └── matcher-deployment           (3–12 replicas, high throughput)
│
├── Namespace: delivery
│   ├── alert-engine-deployment      (2–4 replicas)
│   ├── notification-deployment      (2–4 replicas)
│   └── api-gateway-deployment       (3–10 replicas)
│
├── Namespace: data
│   ├── postgresql (StatefulSet, PVC)
│   ├── elasticsearch (StatefulSet, 3 nodes)
│   ├── redis (StatefulSet, cluster mode)
│   └── kafka (StatefulSet, 3 brokers)
│
└── Namespace: frontend
    ├── nextjs-web-deployment        (2–6 replicas)
    └── dashboard-bff-deployment     (2–6 replicas)
```

### CI/CD Pipeline

```
Developer Push
    │
    ▼
GitHub Actions
├── Lint (ESLint, Ruff)
├── Unit Tests (Jest, pytest)
├── Security Scan (Trivy, Snyk)
├── Docker Build & Push (ECR)
│
├── [main branch]
│   ├── Deploy to Staging (EKS staging)
│   ├── Integration Tests
│   ├── E2E Tests (Playwright)
│   └── Deploy to Production (EKS prod) — manual approval
│
└── [PR]
    ├── Preview Deploy (Vercel / ephemeral k8s namespace)
    └── Automated PR Comment with test results
```

---

## 12. Observability & Monitoring

### Observability Stack

```
Metrics   → Prometheus + Grafana
Logging   → Fluentd → OpenSearch (ELK-compatible)
Tracing   → OpenTelemetry → Jaeger
Alerting  → PagerDuty (on-call rotation)
Uptime    → Checkly (external monitoring from 10 regions)
```

### Key Dashboards

1. **System Health** — CPU, memory, pod restarts, error rates per service
2. **Collection Pipeline** — Events/sec by source, collection success rate, lag
3. **Alert Engine** — Alerts generated/hour, delivery success rate, latency P50/P95/P99
4. **Business Metrics** — Organizations onboarded, MRR, API usage by tier
5. **Security** — Failed auth attempts, rate limit hits, anomalous access patterns

### SLOs & Error Budgets

| SLO | Target | Error Budget (30-day) |
|---|---|---|
| API availability | 99.9% | 43.8 minutes |
| Alert delivery < 60 min | 95% of alerts | 5% miss rate |
| Search query latency < 500ms | 99th percentile | 1% of queries |
| Collection pipeline uptime | 99.5% | 3.65 hours |

---

## 13. Disaster Recovery & Resilience

### Recovery Objectives

| Scenario | RTO | RPO |
|---|---|---|
| Single AZ failure | < 2 min | < 5 min |
| Full region failure | < 30 min | < 15 min |
| Database corruption | < 4 hours | < 1 hour |
| Complete platform loss | < 8 hours | < 4 hours |

### Backup Strategy

- **PostgreSQL:** Continuous WAL archiving to S3; daily full snapshots; 30-day retention
- **Elasticsearch:** Automated snapshots to S3 every 6 hours; 14-day retention
- **Kafka:** 7-day log retention; replicated across 3 brokers
- **Cross-Region:** Critical data replicated to `eu-west-1` (GDPR) and `ap-southeast-1`

### Chaos Engineering

Monthly chaos experiments using AWS Fault Injection Simulator:
- Random pod termination (simulated via Chaos Monkey)
- AZ network partition
- Database primary failover
- Kafka broker failure
- Slow dependency injection (simulate slow LLM API response)

---

*Document maintained by: Hardik Bhaskar | UMBRA Intelligence | Architecture v1.0.0*

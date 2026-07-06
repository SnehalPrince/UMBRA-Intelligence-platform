<div align="center">

```
██╗   ██╗███╗   ███╗██████╗ ██████╗  █████╗
██║   ██║████╗ ████║██╔══██╗██╔══██╗██╔══██╗
██║   ██║██╔████╔██║██████╔╝██████╔╝███████║
██║   ██║██║╚██╔╝██║██╔══██╗██╔══██╗██╔══██║
╚██████╔╝██║ ╚═╝ ██║██████╔╝██║  ██║██║  ██║
 ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
```

### **The Shadow Intelligence Platform**
*See what lives in the shadows — before it finds you.*

---

[![License](https://img.shields.io/badge/license-MIT-red.svg?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-22_LTS-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=flat-square&logo=redis)](https://redis.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://postgresql.org)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?style=flat-square&logo=pnpm)](https://pnpm.io)

</div>

---

## What is UMBRA?

**UMBRA** is a **developer-first, AI-native cyber threat intelligence platform** that monitors underground networks — Tor, I2P, Telegram channels, paste sites, dark marketplaces, and hacker forums — for credential breaches, leaked PII, brand threats, and adversary planning signals targeting your organization.

> Over **88% of basic web application attacks** use stolen credentials *(Verizon 2025 DBIR)*.
> More than **24 billion username-password pairs** currently circulate on criminal markets.
> The window between credential harvest and weaponization is your only chance to act.
> **UMBRA closes that window.**

### Why UMBRA?

| Problem with existing tools | UMBRA's answer |
|---|---|
| Enterprise-only pricing ($50K–$100K+/yr) | Self-serve plans from **$99/month** |
| Sales-gated, weeks to onboard | **Under 5 minutes** to first alert |
| Raw data dumps, no context | **AI-generated** summaries + remediation playbooks |
| Dated, slow dashboards | **Modern** Next.js UI with real-time WebSocket feeds |
| No API-first approach | **REST API** with full OpenAPI 3.0 spec |
| High false-positive alert noise | **XGBoost risk scoring** + LLM triage reduces noise |

---

## Dashboard Preview

![UMBRA Command Center — Platform Overview showing real-time threat telemetry, risk scoring, watchlist, critical findings, AI insights powered by Claude](docs/screenshots/dashboard.png)

> **UMBRA Command Center** — Real-time threat telemetry, AI-powered risk scoring, and live breach activity feed. Organization risk score, active watchlist, critical findings, and Claude-generated AI insights — all in one view.

---

## Key Features

- 🕵️ **Dark Web Monitoring** — Tor, I2P, Telegram, Discord, paste sites, ransomware leak sites
- 🔐 **Credential Breach Detection** — sub-60-minute detection from harvest to alert
- 🤖 **AI Threat Intelligence** — Claude-powered summaries, risk scoring, MITRE ATT&CK mapping
- 📊 **Real-Time Dashboard** — Live alert feed, threat metrics, watchlist management
- 🔔 **Multi-Channel Alerts** — Email, Slack, Teams, webhooks, PagerDuty, Jira
- 🗄️ **Watchlist Management** — Monitor domains, email ranges, brand keywords, IP ranges
- 📈 **Executive Reports** — PDF/CSV exports, weekly digests, compliance-ready audit logs
- 🔑 **API-First** — Full REST API + SDK for programmatic integration in CI/CD pipelines
- 🏢 **Multi-Tenant (MSSP)** — Manage multiple client organizations from one dashboard
- 🛡️ **Privacy by Design** — Credentials hashed/anonymized; plaintext PII is never stored

---

## Architecture Overview

UMBRA is a **pnpm monorepo** with a domain-driven microservices backend and a Next.js frontend. The current repository contains the web dashboard and REST API; the full microservices platform is designed to run on Kubernetes (EKS).

```
umbra-platform/
├── apps/
│   ├── api/          ← Express + TypeScript REST API (Node.js 22)
│   └── web/          ← Next.js 16 dashboard (React 19, TailwindCSS 4)
├── docs/             ← Architecture, PRD, API contracts, roadmap
├── docker-compose.yml← Local dev: PostgreSQL + Redis
└── package.json      ← pnpm workspace root
```

### Data Pipeline

```
Dark Web Sources          Intelligence Pipeline         Delivery
─────────────────         ──────────────────────         ────────
Tor .onion sites  ──▶     Content Classifier      ──▶   Email
Telegram channels ──▶     Credential Extractor    ──▶   Slack / Teams
Paste sites       ──▶     MinHash Deduplication   ──▶   Webhook
Ransomware leaks  ──▶     Risk Scorer (XGBoost)   ──▶   PagerDuty
I2P / ZeroNet     ──▶     LLM Enrichment (Claude) ──▶   Dashboard UI
Hacker forums     ──▶     MITRE ATT&CK Mapper     ──▶   REST API
```

---

## Tech Stack

### Frontend (`apps/web`)

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** with App Router + Turbopack |
| UI | **React 19** with Concurrent Rendering |
| Styling | **TailwindCSS 4** with custom design tokens |
| Components | **Radix UI** primitives |
| Animations | **Motion** + **GSAP** + **Lenis** smooth scroll |
| State | **Zustand** |
| Data Fetching | **TanStack Query** |
| Charts | **Recharts** |
| Forms | **React Hook Form** + **Zod** validation |

### Backend (`apps/api`)

| Layer | Technology |
|---|---|
| Runtime | **Node.js 22 LTS** |
| Framework | **Express** + TypeScript |
| Database | **PostgreSQL 16** via **Prisma ORM** |
| Cache / Pub-Sub | **Redis 7** (ioredis) |
| Job Queues | **Bull** (background job processing) |
| Auth | **JWT** (access + refresh tokens) |
| AI Integration | **Google Gemini** API |
| Breach Lookup | **HaveIBeenPwned** API |
| Email | **Nodemailer** (SMTP/SendGrid) |

### Infrastructure (Production)

| Concern | Technology |
|---|---|
| Cloud | **AWS** (us-east-1 primary, eu-west-1 GDPR) |
| Orchestration | **Kubernetes 1.30** (EKS) |
| Service Mesh | **Istio** (mTLS) |
| IaC | **Terraform** + **Helm** |
| CI/CD | **GitHub Actions** → ECR → EKS |
| Edge / WAF | **Cloudflare** |
| Secrets | **HashiCorp Vault** |
| Observability | Prometheus + Grafana + OpenTelemetry + Jaeger |

---

## Getting Started

### Prerequisites

- [Node.js 22 LTS](https://nodejs.org)
- [pnpm 9+](https://pnpm.io/installation)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local PostgreSQL + Redis)

### 1. Clone the repository

```bash
git clone https://github.com/SnehalPrince/UMBRA-Intelligence-platform.git
cd UMBRA-Intelligence-platform
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start local infrastructure

```bash
# Starts PostgreSQL (port 5432) and Redis (port 6379)
docker-compose up -d
```

### 4. Configure environment

```bash
# API environment
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` with your values:

```env
DATABASE_URL="postgresql://umbra:umbra@localhost:5432/umbra_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret"
GEMINI_API_KEY="your-gemini-api-key"
HIBP_API_KEY="your-hibp-api-key"
SMTP_HOST="smtp.sendgrid.net"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

### 5. Run database migrations

```bash
pnpm db:migrate
```

### 6. Start the development servers

```bash
# Start both API and Web concurrently
pnpm dev

# Or individually:
pnpm --filter api dev      # API on http://localhost:4000
pnpm --filter web dev      # Web on http://localhost:3000
```

---

## Project Structure

### API (`apps/api/src`)

```
src/
├── index.ts                  ← Server entry point
├── app.ts                    ← Express app setup (CORS, helmet, morgan)
├── controllers/
│   ├── auth.controller.ts    ← Register, login, logout, token refresh
│   ├── dashboard.controller.ts ← Threat metrics and summary stats
│   ├── findings.controller.ts  ← CRUD for threat findings
│   └── watchlist.controller.ts ← Target watchlist management
├── routes/
│   ├── auth.routes.ts        ← POST /api/auth/*
│   ├── dashboard.routes.ts   ← GET  /api/dashboard/*
│   ├── findings.routes.ts    ← GET/POST/PATCH /api/findings/*
│   └── watchlist.routes.ts   ← GET/POST/DELETE /api/watchlist/*
├── services/
│   ├── ai.service.ts         ← Gemini AI threat analysis
│   ├── email.service.ts      ← Alert email delivery
│   └── hibp.service.ts       ← HaveIBeenPwned breach lookup
├── middlewares/
│   ├── auth.ts               ← JWT bearer token verification
│   └── error.ts              ← Centralized error handler
└── lib/
    ├── prisma.ts             ← Singleton Prisma client
    ├── redis.ts              ← ioredis client
    ├── jwt.ts                ← JWT sign/verify helpers
    └── queue.ts              ← Bull background job queue
```

### Web (`apps/web/src`)

```
src/
├── app/
│   ├── layout.tsx             ← Root layout, fonts, metadata
│   ├── page.tsx               ← Landing / splash page
│   ├── globals.css            ← UMBRA dark theme + CSS variables
│   ├── (auth)/
│   │   ├── layout.tsx         ← Centered auth layout
│   │   ├── login/page.tsx     ← Login form with JWT flow
│   │   └── register/page.tsx  ← Registration with validation
│   └── (dashboard)/
│       ├── layout.tsx         ← Sidebar navigation
│       ├── dashboard/page.tsx ← Threat intelligence overview
│       ├── search/page.tsx    ← Dark web search interface
│       ├── watchlist/page.tsx ← Monitored target management
│       ├── alerts/page.tsx    ← Security alerts feed
│       ├── reports/page.tsx   ← Threat analytics & exports
│       └── settings/page.tsx  ← Account & org settings
├── components/
│   └── ui/
│       ├── button.tsx         ← Variant-based Button (CVA)
│       └── input.tsx          ← Styled Input with ref forwarding
├── providers/
│   ├── QueryProvider.tsx      ← TanStack React Query setup
│   └── SmoothScrollProvider.tsx ← Lenis smooth scroll
└── lib/
    └── utils.ts               ← cn() class merging utility
```

---

## API Reference

Base URL: `http://localhost:4000/api`

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new organization & user |
| `POST` | `/auth/login` | Authenticate and receive JWT tokens |
| `POST` | `/auth/logout` | Invalidate refresh token |
| `POST` | `/auth/refresh` | Rotate access token using refresh token |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard/stats` | Threat metrics and KPI summary |
| `GET` | `/dashboard/recent-alerts` | Most recent alert events |

### Findings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/findings` | List all threat findings (paginated) |
| `GET` | `/findings/:id` | Get a single finding with AI enrichment |
| `PATCH` | `/findings/:id/status` | Update finding status (resolved / FP) |

### Watchlist

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/watchlist` | List monitored assets |
| `POST` | `/watchlist` | Add a domain, email range, or keyword |
| `DELETE` | `/watchlist/:id` | Remove a monitored asset |

> Full OpenAPI 3.0 specification: [`docs/API.md`](docs/API.md)

---

## Database Schema

Core entities managed by Prisma + PostgreSQL:

```
User ──────────────────── Organization
 │                              │
 ├── Sessions                   ├── WatchlistItems (domains, emails, keywords)
 │                              │
 └── (via org)                  ├── Findings (threat events)
                                │     └── AI Enrichment (summary, severity, remediation)
                                │
                                └── Alerts (delivery log)
```

> Full schema: [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma) · Database design: [`docs/Database.md`](docs/Database.md)

---

## Documentation

| Document | Description |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Product Requirements Document — vision, personas, features, pricing |
| [`docs/Architecture.md`](docs/Architecture.md) | Full system architecture with diagrams |
| [`docs/TechStack.md`](docs/TechStack.md) | Technology choices and rationale |
| [`docs/API.md`](docs/API.md) | API endpoint contracts and request/response schemas |
| [`docs/Database.md`](docs/Database.md) | Database schema design and ERD |
| [`docs/Design.md`](docs/Design.md) | UI/UX design system and component library |
| [`docs/Roadmap.md`](docs/Roadmap.md) | Product roadmap across 4 phases |
| [`docs/Requirements.md`](docs/Requirements.md) | Functional and non-functional requirements |
| [`docs/Implementation.md`](docs/Implementation.md) | Implementation plan and developer guide |
| [`docs/Contracts.md`](docs/Contracts.md) | Service contracts and inter-service API specs |
| [`docs/Progress.md`](docs/Progress.md) | Build progress tracker |
| [`docs/ProjectStructure.md`](docs/ProjectStructure.md) | Monorepo directory map |
| [`docs/Mobile-Responsiveness.md`](docs/Mobile-Responsiveness.md) | Mobile UX strategy |

---

## Roadmap

### ✅ Phase 1 — Foundation (Current)
- [x] Monorepo scaffold (pnpm workspaces)
- [x] Express REST API with auth, findings, watchlist, dashboard
- [x] Prisma schema with all core entities
- [x] Next.js dashboard with auth flows and all page routes
- [x] Real-time WebSocket alert infrastructure
- [x] AI service integration (Gemini)
- [x] HIBP breach lookup service
- [x] Redis cache + Bull job queues

### 🔄 Phase 2 — Intelligence Layer (Months 4–6)
- [ ] AI threat summarization (Claude enrichment per finding)
- [ ] Dark forum & paste site monitoring
- [ ] Ransomware leak site monitoring (200+ sites)
- [ ] SIEM integrations (Splunk, Microsoft Sentinel)
- [ ] Multi-tenant MSSP workspace support
- [ ] Python + Node.js SDKs
- [ ] Stripe billing integration

### 🔮 Phase 3 — Visualization & Depth (Months 7–9)
- [ ] 3D Threat Intelligence Graph (Three.js / R3F)
- [ ] Threat actor profiling and MITRE ATT&CK mapping
- [ ] Initial Access Broker (IAB) monitoring
- [ ] Automated remediation workflows (Okta, Azure AD)
- [ ] Brand protection & lookalike domain detection
- [ ] SOC 2 Type II certification

### 🚀 Phase 4 — Enterprise & Scale (Months 10–12)
- [ ] Executive / VIP monitoring module
- [ ] Mobile app (React Native + Expo)
- [ ] White-label solution for MSSPs
- [ ] Custom threat intelligence report generation
- [ ] Integration marketplace ecosystem

---

## Security & Privacy

UMBRA is built with **privacy by design**:

- ✅ **No plaintext credentials ever stored** — emails are SHA-256 hashed; passwords are partially masked
- ✅ **Zero Trust networking** — mTLS between all microservices via Istio service mesh
- ✅ **Encryption everywhere** — AES-256 at rest, TLS 1.3 in transit
- ✅ **Secrets in Vault** — HashiCorp Vault; no secrets in environment variables in production
- ✅ **GDPR-compliant** — EU data residency in eu-west-1; data minimization enforced
- ✅ **Immutable audit logs** — S3 WORM bucket with 7-year retention
- ✅ **Passive monitoring only** — UMBRA performs defensive intelligence only; no offensive operations

> Full security architecture: [`docs/Architecture.md#10-security-architecture`](docs/Architecture.md)

---

## Pricing

| Plan | Price | For |
|---|---|---|
| **Scout** | Free | Individuals, researchers — 1 domain, manual lookups |
| **Operator** | $99/mo | Startups, SMBs — 3 domains, API access, Slack alerts |
| **Sentinel** | $299/mo | Growing teams — 10 domains, SIEM integration |
| **Guardian** | $599/mo | Security teams — 25 domains, remediation workflows |
| **Enterprise** | $999+/mo | Large orgs, MSSPs — unlimited, white-label, SLA |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `git commit -m "feat(api): add threat scoring endpoint"`
4. Push and open a Pull Request

> Please read [`docs/Implementation.md`](docs/Implementation.md) for coding conventions and contribution guidelines.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with 🖤 by [SnehalPrince](https://github.com/SnehalPrince)**

*UMBRA Intelligence — Defensive dark web monitoring. All data used solely for organizational protection.*

</div>

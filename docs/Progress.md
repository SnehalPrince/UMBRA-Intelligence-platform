# UMBRA — Progress Tracker

> Live development progress. Updated as tasks are completed.

**Last Updated:** June 26, 2026  
**Current Phase:** Pre-Development (Planning Complete)  
**Overall MVP Progress:** `0 / 58 tasks` — `0%`

---

## Quick Status

| Module | Status | Progress |
|---|---|---|
| 📋 **Documentation** | ✅ Complete | 11 / 11 docs |
| 🏗️ **Project Setup** | ⬜ Not Started | 0 / 6 tasks |
| 🔐 **Auth** | ⬜ Not Started | 0 / 8 tasks |
| 📊 **Dashboard** | ⬜ Not Started | 0 / 6 tasks |
| 👁️ **Watchlist** | ⬜ Not Started | 0 / 7 tasks |
| 🔍 **Breach Lookup** | ⬜ Not Started | 0 / 7 tasks |
| 🤖 **AI Summary** | ⬜ Not Started | 0 / 5 tasks |
| 📧 **Email Alerts** | ⬜ Not Started | 0 / 5 tasks |
| 📄 **Reports** | ⬜ Not Started | 0 / 6 tasks |
| 🚀 **Deployment** | ⬜ Not Started | 0 / 5 tasks |
| 🧪 **Testing & QA** | ⬜ Not Started | 0 / 3 tasks |

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Done — merged, tested, deployed to staging |
| 🔄 | In Progress — actively being worked on |
| 🔁 | In Review — PR open, awaiting review/merge |
| ⏸️ | Blocked — waiting on dependency or decision |
| ⬜ | Not Started |
| ❌ | Cancelled / Descoped |
| 🔵 | Deferred to v2 |

---

## Phase 0 — Documentation ✅

> All planning documents created and in review.

| # | Document | Status | Notes |
|---|---|---|---|
| D-01 | `PRD.md` — Product Requirements | ✅ Done | |
| D-02 | `Design.md` — Visual Design Spec | ✅ Done | |
| D-03 | `Architecture.md` — System Architecture | ✅ Done | |
| D-04 | `TechStack.md` — Technology Choices | ✅ Done | |
| D-05 | `Requirements.md` — Functional Requirements | ✅ Done | |
| D-06 | `Mobile-Responsiveness.md` | ✅ Done | |
| D-07 | `API.md` — REST API Reference | ✅ Done | |
| D-08 | `Database.md` — Schema Design | ✅ Done | |
| D-09 | `Contracts.md` — Interface Contracts | ✅ Done | |
| D-10 | `ProjectStructure.md` — File Tree | ✅ Done | |
| D-11 | `Roadmap.md` — Development Roadmap | ✅ Done | |
| D-12 | `Implementation.md` — MVP Plan | ✅ Done | |
| D-13 | `Progress.md` — This File | ✅ Done | |

---

## Phase 1 — Project Setup ⬜

> Initialize monorepo, configure tooling, connect all infrastructure services.

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| S-01 | Initialize pnpm monorepo (`apps/web`, `apps/api`) | ⬜ | | |
| S-02 | Configure TypeScript + ESLint + Prettier (shared config) | ⬜ | | |
| S-03 | Set up `docker-compose.yml` (PostgreSQL + Redis local) | ⬜ | | |
| S-04 | Initialize Prisma + run first migration (empty schema) | ⬜ | | |
| S-05 | Configure `.env.example` with all required variables | ⬜ | | |
| S-06 | Set up GitHub Actions CI (lint + type-check on PR) | ⬜ | | |

**Blockers:** None  
**Notes:** —

---

## Phase 2 — Authentication 🔐 ⬜

> Secure signup, login, JWT session management, forgot password.

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| A-01 | Prisma schema: `User`, `Org`, `RefreshToken` models | ⬜ | | |
| A-02 | `POST /api/auth/register` — email + password, bcrypt hash | ⬜ | | |
| A-03 | `POST /api/auth/login` — validate + issue JWT + refresh token | ⬜ | | |
| A-04 | `POST /api/auth/refresh` — rotate access token | ⬜ | | |
| A-05 | `POST /api/auth/logout` — revoke refresh token | ⬜ | | |
| A-06 | `POST /api/auth/forgot-password` + `reset-password` — email link flow | ⬜ | | |
| A-07 | Auth middleware: validate JWT, attach `req.user` to all protected routes | ⬜ | | |
| A-08 | Frontend: Login page, Signup page, Forgot Password page | ⬜ | | |

**Blockers:** None  
**Notes:** Use `httpOnly` cookie for token storage (not localStorage).

---

## Phase 3 — Dashboard 📊 ⬜

> Overview page: risk score, alert cards, stats, activity chart.

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| DC-01 | `GET /api/dashboard/stats` — aggregate risk score, counts | ⬜ | | |
| DC-02 | `GET /api/dashboard/activity` — 30-day finding count by date | ⬜ | | |
| DC-03 | Frontend: Risk Score card (0–100, color-coded) | ⬜ | | |
| DC-04 | Frontend: Statistics cards (total findings, critical, resolved) | ⬜ | | |
| DC-05 | Frontend: Activity line chart (Recharts, 30-day) | ⬜ | | |
| DC-06 | Frontend: Recent alerts feed (last 10, severity badges) | ⬜ | | |

**Blockers:** A-07 (auth middleware) must be done first  
**Notes:** —

---

## Phase 4 — Watchlist 👁️ ⬜

> Add/edit/delete monitored domains and keywords. Trigger scans.

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| W-01 | Prisma schema: `WatchlistItem` model | ⬜ | | |
| W-02 | `GET /api/watchlist` — list all items for org | ⬜ | | |
| W-03 | `POST /api/watchlist` — add domain/keyword, enqueue scan | ⬜ | | |
| W-04 | `PATCH /api/watchlist/:id` — edit label | ⬜ | | |
| W-05 | `DELETE /api/watchlist/:id` — soft delete | ⬜ | | |
| W-06 | BullMQ: `VerificationJob` (mocked — auto-approve after 60s) | ⬜ | | |
| W-07 | Frontend: Watchlist page (add form, table, status badges) | ⬜ | | |

**Blockers:** S-04 (Prisma) must be done first  
**Notes:** Verification is mocked — show "Verifying..." for 60 seconds then flip to "Active".

---

## Phase 5 — Breach Lookup 🔍 ⬜

> Query HIBP API, store findings, calculate risk scores.

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| B-01 | Prisma schema: `Finding`, `Alert` models | ⬜ | | |
| B-02 | `hibpService.ts` — HIBP API v3 client with rate limiting | ⬜ | | |
| B-03 | `riskScorer.ts` — recency + data classes + volume → risk score | ⬜ | | |
| B-04 | BullMQ: `BreachScanJob` — runs HIBP lookup, saves findings | ⬜ | | |
| B-05 | `GET /api/findings` — paginated list with severity/status filters | ⬜ | | |
| B-06 | `GET /api/findings/:id` — finding detail with AI summary | ⬜ | | |
| B-07 | `PATCH /api/findings/:id/status` — mark resolved / false positive | ⬜ | | |

**Blockers:** W-06 (watchlist item active) must trigger B-04  
**Notes:** If no HIBP Enterprise key, seed a local JSON dataset of real public breaches for demo.

---

## Phase 6 — AI Summary 🤖 ⬜

> Claude API enrichment: summary, severity, remediation, MITRE mapping.

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| AI-01 | `aiService.ts` — Anthropic SDK client + prompt builder | ⬜ | | |
| AI-02 | `aiCache.ts` — Redis cache wrapper (1hr TTL per finding hash) | ⬜ | | |
| AI-03 | BullMQ: `AIEnrichJob` — call Claude, parse JSON, update finding | ⬜ | | |
| AI-04 | Graceful fallback — if Claude fails: `aiStatus = 'failed'`, alert still delivers | ⬜ | | |
| AI-05 | Frontend: `AISummaryCard` component (summary, severity badge, remediation steps, MITRE tags) | ⬜ | | |

**Blockers:** B-04 must enqueue AI-03 after saving finding  
**Notes:** Use `claude-3-5-haiku-20241022` — fastest, cheapest. Budget ~$0.01 per enrichment.

---

## Phase 7 — Email Alerts 📧 ⬜

> Send immediate alerts and weekly digest via SendGrid.

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| E-01 | `emailService.ts` — SendGrid API client + template renderer | ⬜ | | |
| E-02 | HTML email templates: `alert-critical.html`, `alert-high.html` | ⬜ | | |
| E-03 | BullMQ: `EmailAlertJob` — send alert if severity ≥ user threshold | ⬜ | | |
| E-04 | BullMQ: `WeeklyDigestJob` — cron every Monday 9am, weekly summary | ⬜ | | |
| E-05 | Frontend: notification preference settings (threshold + digest toggle) | ⬜ | | |

**Blockers:** AI-03 should complete before E-03 ideally (so email includes AI summary)  
**Notes:** CAN-SPAM: every email must have unsubscribe link.

---

## Phase 8 — Reports 📄 ⬜

> PDF threat report and CSV export.

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| R-01 | Prisma schema: `Report` model | ⬜ | | |
| R-02 | `pdfGenerator.ts` — Puppeteer HTML → PDF | ⬜ | | |
| R-03 | `report.html` — full HTML template (styled with Tailwind inline styles) | ⬜ | | |
| R-04 | BullMQ: `PDFGenJob` — generate PDF, upload to R2/Supabase Storage, update report record | ⬜ | | |
| R-05 | `POST /api/reports/generate` + `GET /api/reports/:id` + download endpoint | ⬜ | | |
| R-06 | Frontend: Reports page + CSV export button | ⬜ | | |

**Blockers:** Cloud storage (R2 or Supabase) must be configured first  
**Notes:** PDF report must include: cover page, risk score, findings table, AI remediation steps, data classes breakdown.

---

## Phase 9 — Deployment 🚀 ⬜

> Ship to production. Real users can sign up.

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| DEP-01 | Deploy API to Railway (with PostgreSQL + Redis add-ons) | ⬜ | | |
| DEP-02 | Deploy frontend to Vercel; configure env vars | ⬜ | | |
| DEP-03 | Configure custom domain (`app.umbra.io`, `api.umbra.io`) + Cloudflare | ⬜ | | |
| DEP-04 | Run `prisma migrate deploy` in production; verify schema | ⬜ | | |
| DEP-05 | Smoke test: full user journey end-to-end in production | ⬜ | | |

**Blockers:** All Phase 1–8 tasks must be done first  
**Notes:** Keep Railway on hobby plan (~$5/mo) until first paying customer.

---

## Phase 10 — Testing & QA 🧪 ⬜

> Verify MVP definition of done from `Implementation.md` §11.

| # | Task | Status | Owner | Notes |
|---|---|---|---|---|
| QA-01 | Run full Definition of Done checklist (`Implementation.md` §11) | ⬜ | | |
| QA-02 | Cross-browser test: Chrome, Firefox, Safari (desktop + mobile) | ⬜ | | |
| QA-03 | Load test API: 50 concurrent users, all P95 latency < 300ms | ⬜ | | |

---

## Completed Tasks Log

> Moved here when ✅. Acts as a changelog.

| Date | Task | Description |
|---|---|---|
| June 26, 2026 | D-01 to D-13 | All 13 documentation files created and committed to `docs/` |

---

## Bugs & Issues

> Active bugs. Resolved bugs are removed from this table.

| # | Severity | Description | Status | Linked Task |
|---|---|---|---|---|
| — | — | *No bugs yet — development not started* | — | — |

---

## Decisions Log

> Architecture and design decisions made during development. Reasoning captured to avoid re-litigating.

| Date | Decision | Rationale |
|---|---|---|
| June 26, 2026 | Use Express.js (not NestJS) for MVP API | NestJS adds boilerplate complexity. Express is minimal and faster to ship at MVP scale. Can migrate to NestJS in v2. |
| June 26, 2026 | BullMQ (Redis) for job queue instead of Kafka | Kafka is operationally complex and unnecessary at MVP scale. BullMQ on Redis handles all our async job needs. Kafka deferred to v2. |
| June 26, 2026 | PostgreSQL only (no Elasticsearch, no ClickHouse) | Full-text search via PostgreSQL `tsvector` is sufficient for MVP. Add Elasticsearch when search latency becomes a problem at scale. |
| June 26, 2026 | Mocked domain verification | Real DNS TXT verification adds 15+ minutes to onboarding UX. Auto-approve after 60s for MVP; real verification in v2. |
| June 26, 2026 | HIBP API as primary breach data source | Building a Tor/Telegram crawler is a 4–6 week project. HIBP provides real, credible breach data immediately for MVP demo value. |
| June 26, 2026 | Claude Haiku (not Sonnet) for enrichment | Haiku: $0.001/K tokens input, ~200ms latency. Sonnet: $0.015/K tokens, ~800ms. For MVP volume, Haiku is sufficient. |
| June 26, 2026 | Puppeteer for PDF generation | Headless Chrome renders our styled HTML templates perfectly. pdfmake requires learning a proprietary DSL. |
| June 26, 2026 | Vercel + Railway for hosting | Zero-config deployment for Next.js (Vercel) and Node.js API (Railway). No DevOps overhead at MVP stage. |
| June 26, 2026 | Modern animation stack: Lenis + Motion + GSAP | User preference. Lenis for smooth inertia scroll (always on). `motion/react` (Framer Motion) for declarative React UI animations. GSAP + ScrollTrigger reserved for complex scroll-driven sequences. Sonner for toasts, Vaul for mobile drawers. CSS transitions for simple hover states. Never animate `width/height/top/left` — GPU-composited `transform` + `opacity` only. |
| June 26, 2026 | nuqs for URL state management | URL-based state for filters and pagination — better UX (shareable URLs, browser back/forward works), zero extra store boilerplate. |

---

## Environment Setup Checklist

Required before starting development:

- [ ] Node.js 22 LTS installed (`node --version`)
- [ ] pnpm installed (`npm i -g pnpm`)
- [ ] Docker Desktop installed (for local PostgreSQL + Redis)
- [ ] Anthropic API key obtained (console.anthropic.com)
- [ ] SendGrid account created + API key + sender domain verified
- [ ] HaveIBeenPwned API key obtained (pwnedpasswords.com/api)
- [ ] Supabase project created (or Railway PostgreSQL ready)
- [ ] Upstash Redis instance created (upstash.com)
- [ ] Cloudflare R2 bucket created (for PDF storage)
- [ ] Vercel account connected to GitHub repo
- [ ] Railway project connected to GitHub repo
- [ ] All keys added to `.env.local` (never commit to git)

---

## Useful Commands

```bash
# Start local dev stack (PostgreSQL + Redis)
docker-compose up -d

# Install all workspace dependencies
pnpm install

# Run database migrations
pnpm --filter api exec prisma migrate dev

# Start API server (dev mode with hot-reload)
pnpm --filter api dev

# Start Next.js frontend (dev mode)
pnpm --filter web dev

# Run type-check across all packages
pnpm typecheck

# Run lint across all packages
pnpm lint

# Open Prisma Studio (DB GUI)
pnpm --filter api exec prisma studio
```

---

*Progress tracker maintained by: Hardik Bhaskar | UMBRA Intelligence | Updated manually after each completed task*

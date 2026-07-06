# UMBRA — Implementation Plan

> MVP Scope, Architecture Decisions & Future Roadmap

**Version:** 1.0.0  
**Author:** Hardik Bhaskar  
**Context:** College / Hackathon Build — Ship a real, working product fast  
**Last Updated:** June 2026

---

## Table of Contents

1. [Philosophy: MVP First](#1-philosophy-mvp-first)
2. [Tech Stack — MVP](#2-tech-stack--mvp)
3. [MVP Scope — What We Build Now](#3-mvp-scope--what-we-build-now)
4. [MVP Architecture](#4-mvp-architecture)
5. [Module-by-Module Implementation Guide](#5-module-by-module-implementation-guide)
6. [Database Schema — MVP](#6-database-schema--mvp)
7. [Project Structure — MVP](#7-project-structure--mvp)
8. [API Endpoints — MVP](#8-api-endpoints--mvp)
9. [What We Deliberately Skip (v2+)](#9-what-we-deliberately-skip-v2)
10. [MVP → v2 Upgrade Path](#10-mvp--v2-upgrade-path)
11. [Definition of MVP Done](#11-definition-of-mvp-done)

---

## 1. Philosophy: MVP First

> *"Make it work, make it right, make it fast — in that order."*

UMBRA's full architecture (`Architecture.md`) is the north star. But for a college build / initial ship, **we deliberately cut complexity** without cutting product value.

The MVP must deliver one clear user journey end-to-end:

```
User signs up
    → Adds their domain to the watchlist
    → UMBRA searches breach datasets for their domain
    → Risk score is calculated and shown
    → AI summary explains the threat in plain English
    → Email alert is sent
    → User downloads a PDF report
```

Everything outside that loop is v2.

### What MVP Proves

1. The **core product hypothesis**: security teams will pay for fast, AI-enriched breach alerts
2. The **technical feasibility**: breach data can be found, scored, and summarized automatically
3. The **UX concept**: a beautiful, modern dashboard beats every legacy competitor on first impression

---

## 2. Tech Stack — MVP

Deliberately simplified vs. the full `TechStack.md`. No Kafka, no Kubernetes, no microservices.

### Backend

| Layer | Choice | Why |
|---|---|---|
| Runtime | **Node.js 22 + TypeScript** | Familiar, fast to ship, great ecosystem |
| Framework | **Express.js** (or Fastify) | Lightweight, no magic, easy to reason about |
| ORM | **Prisma** | Type-safe, great migration tooling, works perfectly with PostgreSQL |
| Database | **PostgreSQL 16** | Single DB covers everything at MVP scale |
| Cache | **Redis** (optional, Docker) | Session store, rate-limit counter, email job queue |
| Job Queue | **BullMQ** (Redis-backed) | Async jobs: breach scan, PDF generation, email digest |
| Auth | **JWT** (jsonwebtoken) + bcrypt | Stateless, simple, no SSO complexity yet |
| AI / LLM | **Anthropic Claude API** | Best-in-class summaries; `claude-3-5-haiku` for cost |
| Email | **SendGrid** (or Nodemailer + SMTP) | Transactional alerts + weekly digest |
| PDF | **Puppeteer** or **pdfmake** | HTML-to-PDF report generation |
| Breach Data | **HaveIBeenPwned API v3** + stored datasets | Real breach lookup without building a crawler |
| Validation | **Zod** | Schema validation on all API inputs |

### Frontend

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR + CSR in one; best-in-class React ecosystem |
| Styling | **Tailwind CSS 4** | Fast design tokens, utility-first, zero runtime CSS |
| Components | **shadcn/ui** (Radix UI) | You own the code; accessible Radix primitives under the hood |
| State | **Zustand** | Lightweight global state for alerts, auth, UI flags |
| Data Fetching | **TanStack Query** | Cache management, loading states, polling for live alert feed |
| Charts | **Recharts** | Risk trend charts, source breakdown, activity sparklines |
| Forms | **React Hook Form + Zod** | Type-safe, performant form validation with schema sharing |
| URL State | **nuqs** | URL-based query parameter state (filters, pagination) |

#### Animation & Motion Layer

This is the layer that makes UMBRA look and feel like a premium, cutting-edge product — not a generic SaaS template.

| Library | Role | When to Use |
|---|---|---|
| **Lenis** (`lenis/react`) | Smooth scroll | Wrap the entire app in `<ReactLenis root>` — gives that buttery inertia scroll. Always on. |
| **Motion** (`motion/react`) — formerly Framer Motion | Declarative React animations | Page transitions, component mount/unmount reveals, layout animations, gesture-based interactions. Use `<motion.div>` for most animated elements. |
| **GSAP + ScrollTrigger** (`gsap`) | Scroll-driven timelines | Complex orchestrated sequences: dashboard KPI card reveals on scroll, number countups, alert feed stagger animations. Use when Motion isn't enough. |
| **CSS Transitions** (native) | State-change micro-interactions | Hover effects, focus rings, color transitions. Always prefer CSS for simple state changes — zero JS cost. |

**GSAP + Lenis integration (sync their tickers):**
```typescript
// providers/SmoothScrollProvider.tsx
'use client';
import { ReactLenis, useLenis } from 'lenis/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenis = useLenis(({ scroll }) => {
    ScrollTrigger.update(); // Keep ScrollTrigger in sync
  });

  useEffect(() => {
    // Drive Lenis with GSAP's RAF for frame-perfect sync
    function onFrame(time: number) {
      lenis?.raf(time * 1000);
    }
    const unsubscribe = gsap.ticker.add(onFrame);
    gsap.ticker.lagSmoothing(0); // Prevent frame-drop compensation artifacts
    return () => unsubscribe();
  }, [lenis]);

  return (
    <ReactLenis root options={{ lerp: 0.08, autoRaf: false }}>
      {children}
    </ReactLenis>
  );
}
```

**Motion pattern for alert card entry animations:**
```typescript
// Staggered alert card reveals
import { motion } from 'motion/react';

const cardVariants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
};

// Usage: <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible">
```

**Key animation rules (inspired by `anthropics/skills@frontend-design` + `leonxlnx/taste-skill@design-taste-frontend`):**

1. **Animate `transform` + `opacity` only** — never `width`, `height`, `top`, `left`. GPU-composited only.
2. **Restraint is premium** — one orchestrated reveal per page section beats 10 scattered effects.
3. **`motion/react` for UI** (modals, drawers, tooltips, hovers), **GSAP for scroll timelines** (KPI reveals, data charts counting up).
4. **Never animate the same property on the same element from both libraries** — pick one per element.
5. **`prefers-reduced-motion`** — wrap all GSAP timelines in `window.matchMedia('(prefers-reduced-motion: reduce)')` check.

#### Notification & Overlay Components

| Library | Role |
|---|---|
| **Sonner** | Toast notifications (alert confirmed, scan complete, email sent) |
| **Vaul** | Bottom-drawer component for mobile alert detail view |
| **Radix UI Primitives** | Dialog, Dropdown, Tooltip, Popover (via shadcn/ui wrappers) |

### Infrastructure — MVP

| Concern | Choice |
|---|---|
| Hosting (API) | **Railway** or **Render** (free tier → paid) |
| Hosting (Web) | **Vercel** (free tier) |
| Database | **Supabase** (managed PostgreSQL) or Railway PostgreSQL |
| Redis | **Upstash** (serverless Redis, free tier) |
| File Storage | **Cloudflare R2** or **Supabase Storage** (PDF reports) |
| Email | **SendGrid** (free: 100 emails/day) |
| Domain / SSL | **Cloudflare** (free) |
| CI | **GitHub Actions** (free) |

**Total MVP infrastructure cost:** ~$0–$20/month until first paying customer.

### Frontend Package Install

```bash
# Core framework + styling
pnpm add next@15 react@19 react-dom@19 tailwindcss@4

# UI components
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tooltip
# (or use shadcn CLI: npx shadcn@latest init)

# Animation & Motion
pnpm add lenis motion gsap

# Notifications & Overlays
pnpm add sonner vaul

# State & data
pnpm add zustand @tanstack/react-query nuqs

# Forms
pnpm add react-hook-form @hookform/resolvers zod

# Charts
pnpm add recharts

# Utilities
pnpm add clsx tailwind-merge class-variance-authority
```

### Available npx Skills (for AI-assisted development)

These skills from [skills.sh](https://skills.sh) improve the quality of AI-generated frontend code. Install them in your AI coding agent for better design output:

| Skill | Installs | Best For |
|---|---|---|
| `npx skills add anthropics/skills --skill frontend-design` | 594K | Distinctive, opinionated UI — avoids generic AI aesthetics |
| `npx skills add leonxlnx/taste-skill --skill design-taste-frontend` | 188K | Anti-slop landing pages; configures design variance, motion intensity, density dials |
| `npx skills add leonxlnx/taste-skill --skill imagegen-frontend-web` | 107K | AI image generation for web UI mockups |
| `npx skills add heygen-com/hyperframes --skill css-animations` | 72K | CSS animation patterns and best practices |
| `npx skills add pbakaus/impeccable --skill frontend-design` | 54K | Production-grade frontend design patterns |

---

## 3. MVP Scope — What We Build Now

### ✅ M1 — Authentication

| Feature | Details |
|---|---|
| Sign Up | Email + password; bcrypt hash; send verification email |
| Log In | Email + password → JWT (15 min access token + 7-day refresh token) |
| Forgot Password | Email link with signed reset token (valid 1 hour) — **include in MVP** |
| JWT Middleware | Express middleware: validates token, attaches `req.user` |
| Protected Routes | All dashboard routes behind auth guard |
| Session Storage | JWT in httpOnly cookie (more secure than localStorage) |

---

### ✅ M2 — Dashboard

| Feature | Details |
|---|---|
| Risk Score Card | Organization-level risk score (0–100), color-coded: 0–30 green, 31–60 yellow, 61–100 red |
| Recent Alerts Feed | Last 10 findings, sortable by severity and date |
| Statistics Cards | Total credentials exposed, sources found, breaches this week, resolved count |
| AI Summary Cards | Per-alert AI-generated summary (2 sentences + severity label) |
| Activity Chart | Recharts line chart: findings over last 30 days |
| Source Breakdown | Pie/donut chart: credential sources (Telegram, paste sites, breach DB) |

---

### ✅ M3 — Watchlist

| Feature | Details |
|---|---|
| Add Domain | Input domain → validate format → store + trigger initial scan |
| Add Keywords | Brand name, executive names, product names to monitor |
| Add Email Domain | `@yourcompany.com` pattern matching |
| Edit / Delete | Inline edit label; soft-delete with confirmation |
| Verification | **Mocked for MVP** — show "verification pending" UI, auto-approve after 60 seconds via BullMQ job |
| Watchlist Limits | Free: 1 domain, 3 keywords. Enforce at API layer |
| Scan on Add | When a new watchlist item is added, immediately queue a breach scan job |

---

### ✅ M4 — Credential Lookup

| Feature | Details |
|---|---|
| HIBP Integration | Query HaveIBeenPwned API v3 per monitored email domain |
| Manual Search | One-off lookup: user enters an email address, instant result |
| Stored Findings | All findings persisted in PostgreSQL `findings` table |
| Deduplication | Don't re-alert on the same breach source + domain pair |
| Risk Scoring | Score = weighted combination of: breach recency (40%), source type (30%), credential volume (20%), domain sensitivity (10%) |
| Finding Detail | Source name, breach date estimate, data classes exposed, record count |

---

### ✅ M5 — AI Summary

| Feature | Details |
|---|---|
| LLM Provider | Anthropic Claude API (`claude-3-5-haiku-20241022` for speed + cost) |
| Per-Finding Summary | 2-sentence plain-English explanation of the threat |
| Severity Label | Critical / High / Medium / Low with reasoning |
| Remediation Steps | 3 numbered action items |
| MITRE Hints | 1–2 relevant ATT&CK technique IDs (e.g. T1078) |
| Async Generation | AI summary generated in background job (BullMQ); finding shown immediately with "Generating summary..." state |
| Caching | Cache AI summary per finding hash in Redis (1 hour TTL) — avoid re-generating for duplicate data |
| Fallback | If Claude API fails: finding still shows with raw data; summary marked "Unavailable" |

**Prompt template:**

```
System: You are a senior threat intelligence analyst. Analyze breach findings 
        and provide clear, actionable summaries for security teams.

User: Analyze this breach finding and provide:
      1. A 2-sentence plain-English summary
      2. Severity: Critical/High/Medium/Low with one sentence of reasoning
      3. Three specific remediation steps in priority order
      4. 1-2 MITRE ATT&CK technique IDs (just the IDs, e.g. T1078)

      Finding: {finding_json}
      
      Respond in JSON format:
      {
        "summary": "...",
        "severity": "...",
        "severity_reasoning": "...",
        "remediation": ["step1", "step2", "step3"],
        "mitre": ["T1078"]
      }
```

---

### ✅ M6 — Email Alerts

| Feature | Details |
|---|---|
| Immediate Alert | Sent within 5 minutes of a new Critical/High finding being confirmed |
| Severity Filter | User can set minimum severity for immediate alerts (default: High+) |
| Email Template | Responsive HTML email: finding summary, AI summary snippet, "View in Dashboard" button |
| Weekly Digest | BullMQ cron job: every Monday 9am; summary of past week's findings |
| Provider | SendGrid API (primary) with Nodemailer SMTP fallback |
| Unsubscribe | One-click unsubscribe link in every email (CAN-SPAM compliance) |
| From Address | `alerts@umbra.io` with DKIM configured |

---

### ✅ M7 — Reports

| Feature | Details |
|---|---|
| PDF Report | Organization threat posture report: risk score, findings summary, trend chart, remediation checklist |
| PDF Generation | Puppeteer (headless Chrome renders HTML template → PDF) |
| CSV Export | All findings for selected date range; downloadable from dashboard |
| Report Trigger | Manual ("Generate Report" button) + automatic monthly report |
| Storage | Generated PDFs stored in Cloudflare R2 / Supabase Storage with presigned download URL |
| Report Contents | Cover page, executive summary, findings table, AI remediation steps, appendix (raw data) |

---

## 4. MVP Architecture

No Kafka. No Kubernetes. No microservices. One monolithic Node.js application + PostgreSQL + Redis + BullMQ.

```
                    ┌─────────────────────────────────┐
                    │         NEXT.JS FRONTEND          │
                    │   (Vercel — umbra.io dashboard)   │
                    └──────────────┬──────────────────-─┘
                                   │ HTTPS REST API
                    ┌──────────────▼──────────────────-─┐
                    │       EXPRESS API SERVER           │
                    │   (Railway / Render)               │
                    │                                   │
                    │  ┌──────────┐ ┌────────────────┐  │
                    │  │  Routes  │ │  BullMQ Worker  │  │
                    │  │  /auth   │ │  BreachScanJob  │  │
                    │  │  /alerts │ │  AIEnrichJob    │  │
                    │  │  /watch  │ │  EmailAlertJob  │  │
                    │  │  /search │ │  PDFGenJob      │  │
                    │  │  /report │ │  WeeklyDigestJob│  │
                    │  └──────────┘ └────────────────┘  │
                    └──────┬──────────────┬─────────────┘
                           │              │
              ┌────────────▼──┐    ┌──────▼────────┐
              │  PostgreSQL   │    │  Redis (Upstash)│
              │  (Supabase)   │    │  Job Queue     │
              │               │    │  Session Cache │
              │  - users      │    │  AI Response   │
              │  - orgs       │    │  Cache         │
              │  - watchlist  │    └────────────────┘
              │  - findings   │
              │  - alerts     │
              │  - audit_logs │
              └───────────────┘

External APIs:
  - HaveIBeenPwned API v3
  - Anthropic Claude API
  - SendGrid API
  - Cloudflare R2 (PDF storage)
```

### Request Flow: New Domain Added

```
1. User adds "acme.com" to watchlist
2. POST /api/watchlist → save to PostgreSQL (status: pending_verification)
3. BullMQ: enqueue VerificationJob (mocked: auto-approve after 60s)
4. BullMQ: enqueue BreachScanJob immediately
5. BreachScanJob:
   a. Query HIBP API for acme.com domain
   b. Parse response → extract breach metadata
   c. Calculate risk score
   d. Save findings to PostgreSQL
   e. Enqueue AIEnrichJob per finding
   f. Enqueue EmailAlertJob if severity ≥ user threshold
6. AIEnrichJob:
   a. Check Redis cache (prompt hash)
   b. If miss: call Claude API with finding data
   c. Parse JSON response
   d. Update finding in PostgreSQL with AI summary
   e. Cache response in Redis (1 hour)
7. EmailAlertJob:
   a. Build HTML email from template
   b. Send via SendGrid
   c. Log delivery in PostgreSQL
8. Dashboard: TanStack Query polls /api/findings → shows new finding + AI summary
```

---

## 5. Module-by-Module Implementation Guide

### M1 — Auth Module

**Files:**
```
src/
├── modules/auth/
│   ├── auth.router.ts          ← POST /register, /login, /logout, /refresh, /forgot-password, /reset-password
│   ├── auth.service.ts         ← Business logic: hash, compare, sign JWT
│   ├── auth.middleware.ts      ← Validate JWT, attach req.user
│   └── auth.schema.ts          ← Zod schemas for all auth request bodies
```

**Key implementation decisions:**
- Store refresh tokens in PostgreSQL `refresh_tokens` table (allows revocation)
- Use `httpOnly; Secure; SameSite=Strict` cookies for token storage
- Password reset token: `crypto.randomBytes(32).toString('hex')` stored as SHA-256 hash in DB
- Rate limit login endpoint: 5 attempts / 15 minutes per IP (Redis counter)

---

### M2 — Dashboard Module

**Files:**
```
src/
├── modules/dashboard/
│   ├── dashboard.router.ts     ← GET /dashboard/stats, GET /dashboard/overview
│   └── dashboard.service.ts    ← Aggregate queries: risk score, alert counts, trends
```

**Risk score calculation:**
```typescript
function calculateOrgRiskScore(findings: Finding[]): number {
  if (findings.length === 0) return 0;
  
  const weights = { critical: 40, high: 25, medium: 10, low: 5 };
  const recencyBonus = (daysAgo: number) => Math.max(0, 1 - daysAgo / 90);
  
  let score = findings
    .filter(f => f.status !== 'false_positive')
    .reduce((acc, f) => {
      const base = weights[f.severity as keyof typeof weights] ?? 0;
      const recency = recencyBonus(daysSince(f.detected_at));
      return acc + base * recency;
    }, 0);
  
  return Math.min(100, Math.round(score));
}
```

---

### M3 — Watchlist Module

**Files:**
```
src/
├── modules/watchlist/
│   ├── watchlist.router.ts     ← CRUD endpoints
│   ├── watchlist.service.ts    ← DB operations + scan job enqueue
│   └── watchlist.schema.ts
```

**Mocked verification flow:**
```typescript
// After adding domain, enqueue a job that auto-approves after 60s
await verificationQueue.add('verify-domain', { watchlistItemId: item.id }, {
  delay: 60_000, // 60 second delay simulates DNS check
});

// Worker:
async function processVerification(job: Job) {
  await db.watchlistItem.update({
    where: { id: job.data.watchlistItemId },
    data: { status: 'active', verified_at: new Date() },
  });
  // Trigger breach scan now that it's "verified"
  await breachScanQueue.add('scan', { watchlistItemId: job.data.watchlistItemId });
}
```

---

### M4 — Breach Scan Module

**Files:**
```
src/
├── modules/breach/
│   ├── breach.router.ts        ← POST /search (manual lookup), GET /findings
│   ├── breach.service.ts       ← HIBP API calls, finding persistence
│   ├── breach.scanner.ts       ← Scan orchestrator (called by BullMQ worker)
│   └── risk-scorer.ts          ← Risk score calculation
│
├── jobs/
│   ├── breach-scan.job.ts      ← BullMQ worker
│   └── ai-enrich.job.ts
```

**HIBP API Integration:**
```typescript
// HIBP Domain Search (Enterprise API — or use the email lookup for demo)
async function searchHIBP(domain: string): Promise<HibpBreach[]> {
  const response = await fetch(
    `https://haveibeenpwned.com/api/v3/breacheddomain/${domain}`,
    {
      headers: {
        'hibp-api-key': process.env.HIBP_API_KEY!,
        'User-Agent': 'UMBRA-Intelligence/1.0',
      },
    }
  );
  if (response.status === 404) return []; // No breaches found
  if (!response.ok) throw new Error(`HIBP API error: ${response.status}`);
  return response.json();
}

// Alternative for free tier: mock with curated breach dataset JSON
// shipped with the app for demo/college use
```

**Risk Scorer:**
```typescript
function scoreRisk(breach: HibpBreach, domain: string): FindingRisk {
  let score = 0;
  const now = new Date();
  const breachDate = new Date(breach.BreachDate);
  const daysAgo = (now.getTime() - breachDate.getTime()) / 86_400_000;

  // Recency (40%): fresher = higher risk
  score += Math.max(0, 40 - (daysAgo / 365) * 40);

  // Data classes (30%): passwords = max, emails only = low
  const sensitiveClasses = ['Passwords', 'Credit card CVVs', 'Bank account numbers'];
  const hasSensitive = breach.DataClasses.some(c => sensitiveClasses.includes(c));
  score += hasSensitive ? 30 : 10;

  // Volume (20%): more records = higher risk
  if (breach.PwnCount > 1_000_000) score += 20;
  else if (breach.PwnCount > 100_000) score += 12;
  else score += 5;

  // Verification (10%): verified breaches score higher
  score += breach.IsVerified ? 10 : 5;

  const severity: Severity =
    score >= 75 ? 'critical' :
    score >= 50 ? 'high' :
    score >= 25 ? 'medium' : 'low';

  return { score: Math.round(score), severity };
}
```

---

### M5 — AI Enrichment Module

**Files:**
```
src/
├── modules/ai/
│   ├── ai.service.ts           ← Claude API client + prompt builder
│   └── ai.cache.ts             ← Redis cache wrapper
│
├── jobs/
│   └── ai-enrich.job.ts        ← BullMQ worker
```

**AI Service:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function enrichFinding(finding: Finding): Promise<AIEnrichment> {
  const cacheKey = `ai:${finding.content_hash}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const prompt = buildEnrichmentPrompt(finding);
  
  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');
  
  const result = JSON.parse(content.text) as AIEnrichment;
  await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1hr cache
  return result;
}
```

---

### M6 — Notifications Module

**Files:**
```
src/
├── modules/notifications/
│   ├── email.service.ts        ← SendGrid wrapper + template renderer
│   └── templates/
│       ├── alert-critical.html
│       ├── alert-high.html
│       └── weekly-digest.html
│
├── jobs/
│   ├── email-alert.job.ts
│   └── weekly-digest.job.ts    ← Cron: every Monday 9am
```

**Email Service:**
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

async function sendAlertEmail(to: string, finding: Finding, aiSummary: AIEnrichment) {
  const html = renderTemplate('alert-critical', {
    orgName: finding.org_name,
    severity: finding.severity,
    summary: aiSummary.summary,
    remediation: aiSummary.remediation,
    dashboardUrl: `https://app.umbra.io/alerts/${finding.id}`,
    unsubscribeUrl: `https://app.umbra.io/unsubscribe?token=${finding.org_id}`,
  });

  await sgMail.send({
    to,
    from: { email: 'alerts@umbra.io', name: 'UMBRA Intelligence' },
    subject: `[UMBRA] ${finding.severity.toUpperCase()}: ${finding.breach_name} affects ${finding.domain}`,
    html,
    trackingSettings: { clickTracking: { enable: false } }, // Privacy-first
  });
}
```

---

### M7 — Reports Module

**Files:**
```
src/
├── modules/reports/
│   ├── reports.router.ts       ← POST /reports/generate, GET /reports/:id, GET /reports/:id/download
│   ├── reports.service.ts      ← Orchestrate: data fetch → render → PDF → upload
│   ├── pdf-generator.ts        ← Puppeteer HTML → PDF
│   ├── csv-exporter.ts         ← findings → CSV string
│   └── templates/
│       └── report.html         ← Full report HTML template (Tailwind inline)
│
├── jobs/
│   └── pdf-gen.job.ts
```

**PDF Generation:**
```typescript
import puppeteer from 'puppeteer';

async function generatePDF(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for Docker/Railway
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdf = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    printBackground: true,
  });
  
  await browser.close();
  return pdf;
}
```

---

## 6. Database Schema — MVP

Single PostgreSQL database via Prisma. Simplified from `Database.md` — no ClickHouse, no Elasticsearch, no credential hash tables.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String
  passwordHash      String
  emailVerified     Boolean   @default(false)
  emailVerifyToken  String?
  resetToken        String?
  resetTokenExpiry  DateTime?
  alertThreshold    String    @default("high")  // critical | high | medium | low | none
  unsubscribeToken  String    @default(cuid())
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  org               Org?
  refreshTokens     RefreshToken[]
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique         // stored as SHA-256 hash
  userId    String
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("refresh_tokens")
}

model Org {
  id           String   @id @default(cuid())
  name         String
  plan         String   @default("free")    // free | operator | sentinel
  ownerId      String   @unique
  riskScore    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  owner        User           @relation(fields: [ownerId], references: [id])
  watchlistItems WatchlistItem[]
  findings     Finding[]
  alerts       Alert[]
  reports      Report[]
  @@map("orgs")
}

model WatchlistItem {
  id           String    @id @default(cuid())
  orgId        String
  type         String    // domain | email_domain | keyword
  value        String
  label        String?
  status       String    @default("pending_verification")  // pending_verification | active | disabled
  verifiedAt   DateTime?
  lastScannedAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  org          Org       @relation(fields: [orgId], references: [id], onDelete: Cascade)
  findings     Finding[]

  @@unique([orgId, type, value])
  @@map("watchlist_items")
}

model Finding {
  id             String    @id @default(cuid())
  orgId          String
  watchlistItemId String?
  breachName     String                         // e.g. "LinkedIn 2021"
  breachDate     DateTime?
  domain         String
  sourceType     String                         // hibp | paste | telegram | manual
  severity       String    @default("medium")  // critical | high | medium | low
  riskScore      Int       @default(0)
  recordCount    Int?
  dataClasses    String[]  @default([])         // ["Passwords", "Email addresses"]
  isVerified     Boolean   @default(false)
  contentHash    String?                         // For deduplication
  status         String    @default("new")      // new | in_progress | resolved | false_positive
  // AI Enrichment
  aiStatus       String    @default("pending")  // pending | ready | failed
  aiSummary      String?
  aiSeverityReasoning String?
  aiRemediation  String[]  @default([])
  aiMitreTechniques String[] @default([])
  // Metadata
  resolvedAt     DateTime?
  resolvedNote   String?
  detectedAt     DateTime  @default(now())
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  org            Org       @relation(fields: [orgId], references: [id])
  watchlistItem  WatchlistItem? @relation(fields: [watchlistItemId], references: [id])
  alerts         Alert[]
  @@map("findings")
}

model Alert {
  id          String   @id @default(cuid())
  orgId       String
  findingId   String
  channel     String   @default("email")      // email | webhook | slack
  status      String   @default("pending")    // pending | sent | failed
  sentAt      DateTime?
  error       String?
  createdAt   DateTime @default(now())

  org         Org      @relation(fields: [orgId], references: [id])
  finding     Finding  @relation(fields: [findingId], references: [id])
  @@map("alerts")
}

model Report {
  id          String   @id @default(cuid())
  orgId       String
  type        String   @default("threat_summary")  // threat_summary | compliance_audit
  format      String   @default("pdf")             // pdf | csv
  status      String   @default("generating")      // generating | ready | failed
  fileUrl     String?
  fileSize    Int?
  period      String?  // "30d" | "90d" | "1y"
  generatedAt DateTime?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())

  org         Org      @relation(fields: [orgId], references: [id])
  @@map("reports")
}

model AuditLog {
  id          String   @id @default(cuid())
  orgId       String
  actorId     String?
  eventType   String
  resourceType String?
  resourceId  String?
  changes     Json?
  ipAddress   String?
  createdAt   DateTime @default(now())
  @@map("audit_logs")
}
```

---

## 7. Project Structure — MVP

One monorepo: Next.js frontend + Express API backend.

```
umbra-mvp/
│
├── apps/
│   ├── web/                          ← Next.js 15 frontend (Vercel)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   ├── signup/page.tsx
│   │   │   │   │   └── forgot-password/page.tsx
│   │   │   │   └── (dashboard)/
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── overview/page.tsx
│   │   │   │       ├── alerts/page.tsx
│   │   │   │       ├── alerts/[id]/page.tsx
│   │   │   │       ├── watchlist/page.tsx
│   │   │   │       ├── search/page.tsx
│   │   │   │       ├── reports/page.tsx
│   │   │   │       └── settings/page.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/               ← shadcn/ui primitives
│   │   │   │   ├── alerts/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── watchlist/
│   │   │   │   └── layout/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   └── api/                          ← Express API (Railway)
│       ├── src/
│       │   ├── index.ts              ← Express app entry point
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── watchlist/
│       │   │   ├── breach/
│       │   │   ├── ai/
│       │   │   ├── notifications/
│       │   │   └── reports/
│       │   ├── jobs/                 ← BullMQ workers
│       │   │   ├── breach-scan.job.ts
│       │   │   ├── ai-enrich.job.ts
│       │   │   ├── email-alert.job.ts
│       │   │   ├── pdf-gen.job.ts
│       │   │   └── weekly-digest.job.ts
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   ├── rate-limit.middleware.ts
│       │   │   └── error.middleware.ts
│       │   ├── lib/
│       │   │   ├── prisma.ts
│       │   │   ├── redis.ts
│       │   │   └── queue.ts
│       │   └── config.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── package.json
│
├── package.json                      ← pnpm workspace root
├── pnpm-workspace.yaml
├── .env.example
├── docker-compose.yml                ← Local dev: PostgreSQL + Redis
└── README.md
```

---

## 8. API Endpoints — MVP

Base URL: `http://localhost:4000/api` (dev) | `https://api.umbra.io/api` (prod)

### Auth

```
POST /api/auth/register           → { user, accessToken }
POST /api/auth/login              → { user, accessToken }
POST /api/auth/logout             → 204
POST /api/auth/refresh            → { accessToken }
POST /api/auth/forgot-password    → 204 (sends email)
POST /api/auth/reset-password     → 204
GET  /api/auth/me                 → { user, org }
```

### Dashboard

```
GET  /api/dashboard/stats         → { riskScore, totalFindings, criticalCount, ... }
GET  /api/dashboard/activity      → [{ date, count }] (30-day chart data)
```

### Watchlist

```
GET    /api/watchlist             → [WatchlistItem]
POST   /api/watchlist             → WatchlistItem (+ queues scan)
PATCH  /api/watchlist/:id         → WatchlistItem
DELETE /api/watchlist/:id         → 204
POST   /api/watchlist/:id/scan    → { jobId } (manual re-scan)
```

### Findings / Alerts

```
GET  /api/findings                → paginated [Finding] (filter: severity, status, since)
GET  /api/findings/:id            → Finding (with AI summary)
PATCH /api/findings/:id/status    → Finding (update: resolved, false_positive)
POST /api/search                  → { query, type } → immediate lookup result
```

### Reports

```
POST /api/reports/generate        → { reportId, status: "generating" }
GET  /api/reports                 → [Report]
GET  /api/reports/:id             → Report (with status + download URL)
GET  /api/reports/:id/download    → redirect to presigned file URL
GET  /api/export/findings         → CSV file download (stream)
```

### Settings

```
GET  /api/settings                → { user, org, notificationPrefs }
PATCH /api/settings               → updated settings
PATCH /api/settings/notifications → { alertThreshold, weeklyDigest }
```

---

## 9. What We Deliberately Skip (v2+)

These are **not MVP**. Do not build them now — they add complexity without proportional value at MVP scale.

| Feature | Why Skipped | v2 Plan |
|---|---|---|
| ❌ **Apache Kafka** | BullMQ + Redis handles our job queue needs at MVP scale | Add when processing > 100K events/day |
| ❌ **Kubernetes** | Railway/Render handles deployment; K8s is operational overhead | Add at 1,000+ orgs |
| ❌ **Multi-region deployment** | One region is fine for MVP; GDPR can be addressed with single-region EU config | Add with EU launch |
| ❌ **3D Threat Graph (Three.js)** | Takes 3–4 weeks to build; not core to user value at MVP | Phase 3 per `Roadmap.md` |
| ❌ **Threat Actor Profiles** | Requires deep research pipeline + large dataset | Phase 3 per `Roadmap.md` |
| ❌ **SIEM Integrations** | Enterprise feature; no MVP customers need Splunk connectors | Phase 2 per `Roadmap.md` |
| ❌ **MSSP Multi-tenancy** | Single-org per account is sufficient for MVP | Phase 2 per `Roadmap.md` |
| ❌ **ClickHouse** | PostgreSQL aggregations are fast enough at MVP scale | Add at 10M+ rows |
| ❌ **Elasticsearch** | PostgreSQL full-text search (`tsvector`) is sufficient for MVP finding search | Add when search latency > 500ms at scale |
| ❌ **Complex microservices** | Monolith is simpler to build, deploy, and debug at MVP stage | Extract services post-product-market-fit |
| ❌ **gRPC / Protobuf** | REST + JSON is fine; gRPC adds tooling complexity | Add when inter-service latency matters |
| ❌ **SSO / SAML** | Email/password + JWT is sufficient for MVP customers | Add for Enterprise tier |
| ❌ **IAB Monitoring** | Requires dark web crawlers; too complex for MVP | Phase 3 per `Roadmap.md` |
| ❌ **Ransomware Leak Site Crawlers** | Tor access requires dedicated crawler infrastructure | Phase 2 per `Roadmap.md` |
| ❌ **STIX/TAXII Export** | Advanced enterprise feature; no MVP need | Phase 2 per `Roadmap.md` |

---

## 10. MVP → v2 Upgrade Path

MVP is built to be **additive** — nothing needs to be torn down, only supplemented.

| MVP Component | v2 Upgrade | Effort |
|---|---|---|
| Express API (monolith) | Extract `collector`, `processor`, `matcher` as separate services | ~3 sprints |
| BullMQ jobs | Replace with Apache Kafka topics for collector → processor | ~1 sprint |
| PostgreSQL full-text search | Add Elasticsearch index; dual-write findings to both | ~1 sprint |
| PostgreSQL analytics queries | Add ClickHouse for time-series; keep Postgres as source of truth | ~1 sprint |
| HIBP API only | Add Telegram collector, Tor collector, paste site scanner | ~4 sprints |
| Single-region Railway | Migrate to EKS; Terraform all infrastructure | ~2 sprints |
| Single-org per account | Add MSSP workspace model + org switcher | ~2 sprints |
| Recharts 2D charts | Add Three.js 3D Threat Graph view (alongside, not replacing) | ~3 sprints |
| Prisma schema | Run `prisma migrate` to add new tables — no breaking changes | Incremental |

The monorepo structure in `ProjectStructure.md` is already designed to accommodate services being extracted — each `services/` directory becomes a standalone deployable when the time comes.

---

## 11. Definition of MVP Done

The MVP is **complete and shippable** when all of the following are true:

### Functional

- [ ] A new user can sign up, verify email, and reach the dashboard in < 3 minutes
- [ ] User can add a domain to watchlist and see findings within 5 minutes
- [ ] At least one real breach finding is shown for a test domain (e.g. `linkedin.com`)
- [ ] Risk score updates correctly when findings are added or resolved
- [ ] AI summary is generated for every finding (or gracefully shows "Generating...")
- [ ] Email alert is received within 5 minutes of a Critical/High finding
- [ ] PDF report downloads and contains: risk score, findings table, AI remediation steps
- [ ] CSV export works and contains correct data
- [ ] Password reset flow works end-to-end
- [ ] All forms have proper validation and helpful error messages

### Non-Functional

- [ ] Dashboard loads in < 2 seconds on a 4G mobile connection
- [ ] API responds in < 300ms for all non-AI endpoints
- [ ] No plaintext passwords stored anywhere
- [ ] All API routes require authentication (no unauthorized access)
- [ ] HTTPS enforced on all URLs
- [ ] Works correctly on Chrome, Firefox, Safari (latest 2 versions)
- [ ] Mobile-responsive: all pages usable on a 375px wide screen

### Code Quality

- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No ESLint errors
- [ ] Prisma migrations committed and runnable (`prisma migrate deploy`)
- [ ] `.env.example` up to date with all required variables
- [ ] `README.md` with setup instructions a new developer can follow in < 10 minutes

---

*Document maintained by: Hardik Bhaskar | UMBRA Intelligence | Implementation Plan v1.0.0*

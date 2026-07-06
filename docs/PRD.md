# UMBRA — Product Requirements Document (PRD)
> Advanced Computational System for Multi-Layered Dark Web Analysis,  
> Credential Breach Detection & Proactive Cyber Threat Intelligence

**Version:** 1.0.0  
**Author:** Hardik Bhaskar  
**Status:** Draft → Review  
**Last Updated:** June 2026

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Market Opportunity](#3-market-opportunity)
4. [Target Users & Personas](#4-target-users--personas)
5. [Product Vision & Goals](#5-product-vision--goals)
6. [Competitive Analysis](#6-competitive-analysis)
7. [Feature Set — MoSCoW Prioritization](#7-feature-set--moscow-prioritization)
8. [User Stories](#8-user-stories)
9. [Success Metrics & KPIs](#9-success-metrics--kpis)
10. [Pricing Model](#10-pricing-model)
11. [Product Roadmap](#11-product-roadmap)
12. [Assumptions & Constraints](#12-assumptions--constraints)

---

## 1. Executive Summary

UMBRA is a **developer-first, AI-native cyber threat intelligence platform** that monitors underground networks (Tor, I2P, Telegram, paste sites, dark marketplaces, hacker forums) for credential breaches, leaked PII, brand threats, and adversary planning signals targeting an organization.

Unlike existing enterprise solutions (Recorded Future at $50K–$100K+/yr, SpyCloud at $12K–$30K/yr) that are opaque, sales-gated, and UI-heavy without depth, UMBRA is:

- **Transparent pricing** starting at $99/month (self-serve)
- **API-first** for MSSPs, devs, and security engineers
- **AI-native** — LLM-powered threat summarization and risk scoring
- **Beautiful** — 3D interactive threat visualization dashboards
- **Fast** — sub-60-minute detection time from credential harvest to alert
- **Modular** — pick only the intelligence modules you need

**Tagline:** *"See what lives in the shadows before it finds you."*

---

## 2. Problem Statement

### The Core Problem

Over **88% of basic web application attacks** use stolen credentials (Verizon 2025 DBIR). More than **24 billion username-password pairs** currently circulate on criminal markets. Underground breach postings increased **43% in 2024** alone (Bitsight State of the Underground Report).

The attack playbook has fundamentally shifted: **adversaries log in rather than break in.** Stolen credentials are sold on criminal forums weeks or months before they are weaponized — creating a critical window that most organizations never see.

### Why Current Solutions Fail

| Problem | Reality |
|---|---|
| **Enterprise-only pricing** | Recorded Future, SpyCloud, ZeroFox require $50K–$100K+/year contracts |
| **Opaque coverage** | Vendors "resell" the same 3rd-party feeds under different brand names |
| **Sales-gated access** | No self-serve onboarding; buyers must wait weeks for demos and trials |
| **Alert noise** | High false-positive rates without AI triage; junior analysts overwhelmed |
| **No AI summarization** | Raw data dumps without context or actionable remediation steps |
| **Poor UX** | Dated enterprise dashboards built in the 2010s; no modern visualization |
| **SMB-hostile** | No affordable option for companies with fewer than 500 employees |

### UMBRA's Answer

UMBRA bridges the gap: enterprise-grade dark web intelligence, at mid-market pricing, with a developer-first API, AI-native intelligence layer, and a visually stunning 3D dashboard that makes threat data comprehensible to any security team.

---

## 3. Market Opportunity

### Market Size

| Segment | 2025 Value | 2030 Projected | CAGR |
|---|---|---|---|
| Cyber Threat Intelligence (Global) | $12.8B | $29.2B | 17.9% |
| Dark Web Monitoring (Sub-segment) | $1.6B | $4.8B | 24.7% |
| Credential & Identity Threat Protection | $3.1B | $8.4B | 22.1% |

### Serviceable Addressable Market (SAM)

UMBRA's initial SAM targets:
- **Mid-market enterprises** (100–2000 employees): ~280,000 companies globally
- **MSSPs and security consultancies**: ~65,000 globally
- **Developer teams / SaaS companies** monitoring their own user bases: ~500,000+

At an average contract of $3,600/year (mid-tier plan), the SAM exceeds **$3.1B**.

### The Gap UMBRA Fills

Current pricing tiers leave a massive underserved segment:

```
FREE          $200/mo         $3K–$30K/yr         $50K–$100K+/yr
  |______________|_________________|_________________________|
 HIBP      WhiteIntel     Flare / Breachsense     Recorded Future
                                                  SpyCloud / ZeroFox

                     ← UMBRA TARGET ZONE →
              $99/mo ─────────────── $999/mo
```

---

## 4. Target Users & Personas

### Persona 1 — "Security Sara" (SOC Analyst / Threat Hunter)
- **Role:** Tier 2/3 SOC analyst at a 500-person SaaS company
- **Pain:** Manual dark web lookups, alert fatigue, no context on findings
- **Goal:** Fast, actionable breach alerts with remediation steps built in
- **UMBRA Value:** Sub-60-min alerts, AI-generated summaries, one-click Jira/Slack dispatch

### Persona 2 — "Dev-Sec Dave" (Security Engineer / Developer)
- **Role:** Security engineer at a 50-person startup
- **Pain:** No budget for enterprise tools; APIs either don't exist or cost $50K
- **Goal:** Programmable credential monitoring integrated into their CI/CD pipeline
- **UMBRA Value:** REST API + webhooks, SDK for Python/Node, transparent pricing

### Persona 3 — "MSSP Mike" (Managed Security Service Provider)
- **Role:** Runs a boutique MSSP managing security for 30 SMB clients
- **Pain:** Can't afford separate dark web monitoring contracts per client
- **Goal:** Multi-tenant platform to monitor all clients from one dashboard
- **UMBRA Value:** Multi-org workspace, white-label exports, per-client billing

### Persona 4 — "CISO Carol" (Chief Information Security Officer)
- **Role:** CISO at a 1,000-person financial services firm
- **Pain:** Board demands proof of proactive threat monitoring; current tools don't show ROI
- **Goal:** Executive-level threat reports, compliance coverage, audit trail
- **UMBRA Value:** PDF/PPTX threat reports, regulatory alignment (SOC 2, GDPR, PCI DSS)

---

## 5. Product Vision & Goals

### Vision Statement
> *To democratize dark web threat intelligence — making enterprise-grade breach detection and adversary monitoring accessible to every security team, regardless of size or budget.*

### Strategic Goals (12 Months)
1. **G1:** Reach 1,000 paying organizations within 12 months of launch
2. **G2:** Achieve sub-60-minute median time from credential harvest to alert
3. **G3:** Maintain >95% signal accuracy (minimize false positives via AI triage)
4. **G4:** Cover 5,000+ underground sources (forums, markets, Telegram channels, paste sites)
5. **G5:** Achieve SOC 2 Type II certification by Month 9
6. **G6:** Build ecosystem of 20+ native integrations (SIEM, SOAR, ticketing, IdP)

---

## 6. Competitive Analysis

| Platform | Coverage | Pricing | AI Layer | API-First | Deployment | UX |
|---|---|---|---|---|---|---|
| **Recorded Future** | ★★★★★ | $50K–$100K+/yr | Partial | Partial | Weeks | ★★☆ |
| **SpyCloud** | ★★★★☆ | $12K–$30K/yr | Partial | Partial | Days | ★★★☆ |
| **ZeroFox** | ★★★★☆ | Enterprise | No | No | Weeks | ★★★☆ |
| **Flare** | ★★★☆☆ | $750–$2K/mo | Partial | Partial | Hours | ★★★☆ |
| **WhiteIntel** | ★★★☆☆ | $200/mo | No | Yes | Minutes | ★★★☆ |
| **DarkOwl** | ★★★★★ | Mid-Enterprise | No | Yes | Hours | ★★☆ |
| **HIBP** | ★★☆☆☆ | Free | No | Partial | Instant | ★★★★ |
| **🔮 UMBRA** | ★★★★★ | $99–$999/mo | **Native** | **Yes** | **Minutes** | **★★★★★** |

### UMBRA's Unique Differentiators

1. **AI-Native Intelligence Layer** — LLM-powered threat contextualization, not just data dumps
2. **3D Threat Visualization** — Interactive knowledge graph of threats, actors, and your assets
3. **Multi-Network Coverage** — Tor, I2P, ZeroNet, Freenet, Telegram, Discord, paste sites
4. **Developer SDK** — Python and Node.js SDKs for programmatic integration
5. **Transparent Self-Serve Pricing** — No sales calls required; start monitoring in < 5 minutes
6. **Remediation Workflows** — Automated playbooks: force password resets, block accounts, notify users
7. **Threat Actor Profiles** — Track specific adversaries and their TTPs over time

---

## 7. Feature Set — MoSCoW Prioritization

### Must Have (MVP — v1.0)

**M1. Organization Onboarding & Asset Registration**
- Register domains, email domains, IP ranges, brand keywords
- Multi-domain watchlist with unlimited keyword monitoring (paid tiers)

**M2. Credential Breach Detection**
- Real-time monitoring of stealer logs, combolists, breach databases
- Detection of plaintext and hashed credentials tied to monitored domains
- Alert with source metadata: harvest date, malware family, infostealer type

**M3. Alert Engine**
- Email, Slack, Teams, Webhook alerts within 60 minutes of detection
- Alert deduplication: suppress recycled old compilations
- Severity scoring: Critical / High / Medium / Low

**M4. Threat Feed Dashboard**
- Real-time feed of all threat events for monitored assets
- Filter by source type, severity, date, threat category
- Mark as resolved, false positive, or in-progress

**M5. REST API**
- Full API coverage for all monitoring functions
- API key authentication with rate limiting
- OpenAPI 3.0 specification document

**M6. Basic Reporting**
- Weekly email digest summary
- Downloadable CSV/JSON export of all findings

---

### Should Have (v1.1 — Month 3–4)

**S1. AI Threat Summarization**
- LLM-generated plain-English summaries of each alert
- Risk context: "This credential was found in a RedLine stealer log posted to Telegram 2 hours ago..."
- Recommended remediation steps per finding

**S2. Dark Forum Monitoring**
- Monitor known hacker forums and marketplaces for brand/domain mentions
- Track discussions mentioning your organization or executives

**S3. Ransomware Leak Site Monitoring**
- 200+ active ransomware group leak sites
- Alert if your organization appears as a victim target

**S4. Paste Site Monitoring**
- Pastebin, GitHub Gist, Ghostbin, and 50+ paste sites
- Detect accidentally exposed API keys, secrets, internal documents

**S5. Multi-Tenant (MSSP) Support**
- Manage multiple client organizations from one dashboard
- Per-client reports and billing

**S6. SIEM Integration**
- Native Splunk, Elastic SIEM, Microsoft Sentinel connectors
- STIX/TAXII 2.1 support for threat intel sharing

---

### Could Have (v2.0 — Month 6–9)

**C1. 3D Threat Intelligence Graph**
- Three.js/WebGL interactive knowledge graph
- Visualize relationships between threat actors, TTPs, campaigns, and your assets
- Zoom, filter, and drill into threat actor networks

**C2. Threat Actor Profiling**
- Persistent profiles of tracked adversaries
- Historical activity, known aliases, TTPs (MITRE ATT&CK mapping)
- Alert when a tracked actor mentions your organization

**C3. Automated Remediation Workflows**
- One-click forced password reset via Okta/Azure AD/Google Workspace
- Automatic account lockdown on critical credential exposure
- Jira/ServiceNow ticket auto-creation

**C4. Initial Access Broker (IAB) Monitoring**
- Monitor dark web auctions for access to your network being sold
- 24–48 hour early warning before access is exercised

**C5. Brand Protection & Phishing Detection**
- Lookalike domain detection (typosquatting, homograph attacks)
- Social media impersonation monitoring
- Phishing kit detection

**C6. Executive & VIP Monitoring**
- PII monitoring for C-suite and named employees
- Personal email, phone, address, SSN/passport exposure alerts

---

### Won't Have (Out of Scope for v1.x)

- Offensive operations / active threat hunting (stays defensive)
- Physical world threat intelligence
- Consumer / individual identity monitoring product
- Geopolitical risk analysis (out of scope for v1)

---

## 8. User Stories

### Onboarding
```
AS a security engineer
I WANT to register my organization's domain in under 5 minutes
SO THAT I receive breach alerts without a sales call or procurement process
```

### Credential Monitoring
```
AS a SOC analyst
I WANT to receive an alert within 60 minutes when employee credentials appear in a stealer log
SO THAT I can initiate password resets before the credentials are weaponized

AS a CISO
I WANT to see the full context of a credential breach (source, date, malware family)
SO THAT I can assess the severity and report to the board with specifics
```

### API Usage
```
AS a security engineer
I WANT to query the UMBRA API from my CI/CD pipeline
SO THAT deployments are automatically blocked if a secret key is detected in the wild

AS an MSSP
I WANT to pull breach alerts for all my clients via one API key
SO THAT I can build automated triage workflows into my existing SOAR platform
```

### Reporting
```
AS a CISO
I WANT to generate a one-click executive threat report as a PDF
SO THAT I can present the organization's threat posture to the board monthly

AS a compliance officer
I WANT an exportable audit log of all detected breaches and remediation actions
SO THAT I can demonstrate due diligence during SOC 2 / GDPR audits
```

---

## 9. Success Metrics & KPIs

### Product Health
| Metric | Target (Month 6) | Target (Month 12) |
|---|---|---|
| Monthly Active Organizations | 200 | 1,000 |
| MRR | $25,000 | $150,000 |
| API Requests / Day | 500K | 5M |
| Alert Delivery Time (P50) | < 45 min | < 30 min |
| Alert False Positive Rate | < 8% | < 5% |
| Source Coverage | 2,000+ | 5,000+ |

### Quality
| Metric | Target |
|---|---|
| Platform Uptime | 99.9% |
| API Latency (P95) | < 300ms |
| Time-to-Onboard (new org) | < 5 minutes |
| NPS Score | > 50 |
| Churn Rate (Monthly) | < 3% |

---

## 10. Pricing Model

### Tier Structure

| Plan | Price | For | Key Limits |
|---|---|---|---|
| **Scout** (Free) | $0/mo | Individuals, researchers | 1 domain, 5 emails, manual lookups only, no API |
| **Operator** | $99/mo | Startups, SMBs | 3 domains, 100 emails, API (10K req/mo), Slack alerts |
| **Sentinel** | $299/mo | Growing companies | 10 domains, 500 emails, API (100K req/mo), SIEM integration |
| **Guardian** | $599/mo | Mid-market security teams | 25 domains, 2,000 emails, API (unlimited), remediation workflows |
| **Enterprise** | $999+/mo | Large enterprises, MSSPs | Unlimited, white-label, SLA, dedicated CSM, custom integrations |

### Revenue Model
- **Primary:** SaaS subscription (monthly/annual, 20% discount for annual)
- **Secondary:** API overage charges ($0.01 per 1K requests above plan limit)
- **Tertiary:** Professional services (threat intelligence consulting, custom integrations)

---

## 11. Product Roadmap

### Phase 1 — Foundation (Months 1–3)
- [ ] Core credential breach detection engine
- [ ] Organization onboarding & asset registration
- [ ] Alert engine (email, Slack, webhook)
- [ ] REST API v1 + documentation
- [ ] Basic dashboard (React)
- [ ] Billing integration (Stripe)
- [ ] Stealer log monitoring (Telegram focus)
- [ ] Paste site monitoring

### Phase 2 — Intelligence Layer (Months 4–6)
- [ ] AI threat summarization (Claude/GPT integration)
- [ ] Dark forum monitoring
- [ ] Ransomware leak site monitoring
- [ ] SIEM integrations (Splunk, Sentinel)
- [ ] Multi-tenant MSSP support
- [ ] STIX/TAXII export
- [ ] Python + Node.js SDKs

### Phase 3 — Visualization & Depth (Months 7–9)
- [ ] 3D Threat Intelligence Graph (Three.js)
- [ ] Threat actor profiling system
- [ ] IAB (Initial Access Broker) monitoring
- [ ] Automated remediation workflows (Okta, Azure AD)
- [ ] Brand protection & lookalike domain detection
- [ ] SOC 2 Type II certification

### Phase 4 — Enterprise & Scale (Months 10–12)
- [ ] Executive / VIP monitoring module
- [ ] Mobile app (React Native)
- [ ] White-label solution for MSSPs
- [ ] Custom threat intelligence reports
- [ ] Marketplace / integration ecosystem
- [ ] Series A fundraising / partnership outreach

---

## 12. Assumptions & Constraints

### Assumptions
- Target customers have basic security awareness and an existing email/Slack setup
- Operators of dark web intelligence platforms operate within legal frameworks (passive monitoring, no offensive activity)
- AI/LLM API costs remain manageable at <15% of revenue at scale

### Constraints
- Dark web crawling must comply with local laws (passive monitoring only; no account creation on criminal forums)
- No storage of raw PII beyond what is necessary to deliver alerts (data minimization per GDPR)
- All credential data found must be hashed/anonymized in storage after alerting
- Infrastructure must support multi-region deployment for GDPR data residency

### Legal & Ethical Framework
- UMBRA operates as a **defensive intelligence platform only**
- All data collected is used solely for breach notification and organizational protection
- Zero use of UMBRA data for offensive, attribution, or law enforcement purposes without explicit court order
- Full GDPR, CCPA, SOC 2 compliance as table stakes

---

*Document maintained by: Hardik Bhaskar | UMBRA Intelligence | v1.0.0*

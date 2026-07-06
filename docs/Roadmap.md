# UMBRA — Development Roadmap

> Strategic Milestones, Sprint Plan & Delivery Timeline

**Version:** 1.0.0  
**Author:** Hardik Bhaskar  
**Status:** Draft → Review  
**Last Updated:** June 2026

---

## Table of Contents

1. [Roadmap Philosophy](#1-roadmap-philosophy)
2. [Milestone Overview](#2-milestone-overview)
3. [Phase 1 — Foundation (Months 1–3)](#3-phase-1--foundation-months-13)
4. [Phase 2 — Intelligence Layer (Months 4–6)](#4-phase-2--intelligence-layer-months-46)
5. [Phase 3 — Visualization & Depth (Months 7–9)](#5-phase-3--visualization--depth-months-79)
6. [Phase 4 — Enterprise & Scale (Months 10–12)](#6-phase-4--enterprise--scale-months-1012)
7. [Beyond Year 1 — Vision Backlog](#7-beyond-year-1--vision-backlog)
8. [Sprint Cadence & Ceremonies](#8-sprint-cadence--ceremonies)
9. [Dependency Map](#9-dependency-map)
10. [Risk Register](#10-risk-register)
11. [Success Metrics by Phase](#11-success-metrics-by-phase)
12. [Go-to-Market Milestones](#12-go-to-market-milestones)

---

## 1. Roadmap Philosophy

UMBRA's roadmap follows three guiding principles:

1. **Ruthless MVP discipline** — Phase 1 ships only what is strictly necessary for paying customers to receive value. Every feature that could ship in Phase 2 stays in Phase 2.
2. **Signal before coverage** — A highly accurate, fast detector for the sources we DO cover beats a noisy scanner for 5,000 sources. Precision first, breadth second.
3. **Platform compounds** — Each phase unlocks the next. AI enrichment (Phase 2) becomes more valuable as coverage grows (Phase 3). The 3D graph (Phase 3) becomes a competitive moat as the knowledge graph deepens.

### Priority Labels

| Label | Meaning |
|---|---|
| 🔴 **Critical Path** | Blocks launch or next phase |
| 🟠 **High** | Key customer value, not blocking |
| 🟡 **Medium** | Important for growth/retention |
| 🟢 **Enhancement** | Quality of life, polish |
| 🔵 **Research** | Requires spike/POC before committing |

---

## 2. Milestone Overview

```
YEAR 1 TIMELINE — 12 Months

Month:   1    2    3    4    5    6    7    8    9    10   11   12
         │────│────│────│────│────│────│────│────│────│────│────│
Phase 1  ████████████
         FOUNDATION
                        Phase 2  ████████████
                                 INTELLIGENCE
                                              Phase 3  ████████████
                                                       VISUALIZATION
                                                                    Phase 4  ████
                                                                             ENTERPRISE

KEY MILESTONES:
  Month 1:  Infrastructure provisioned; CI/CD live; dev environment stable
  Month 2:  Alpha: internal testing of core credential detection
  Month 3:  Private Beta: 10–50 design partner orgs onboarded
  Month 4:  Public launch (v1.0 GA); Stripe billing live
  Month 6:  AI enrichment + SIEM integrations live; 200 paying orgs target
  Month 9:  3D Threat Graph live; SOC 2 Type II audit completed
  Month 12: Enterprise tier + white-label live; Series A materials ready
```

---

## 3. Phase 1 — Foundation (Months 1–3)

**Goal:** Ship a working, production-grade credential breach detection system that sends alerts. A paying customer must be able to onboard, add their domain, and receive a real alert within 60 minutes of a breach event appearing in UMBRA's monitored sources.

### Month 1 — Infrastructure & Core Pipeline

#### Week 1–2: Infrastructure Provisioning

| Task | Priority | Owner | Status |
|---|---|---|---|
| Provision AWS accounts (production + staging) | 🔴 Critical Path | DevOps | `[ ]` |
| Terraform: VPC, EKS cluster, RDS PostgreSQL, ElastiCache Redis | 🔴 Critical Path | DevOps | `[ ]` |
| Provision Amazon MSK (Kafka) cluster | 🔴 Critical Path | DevOps | `[ ]` |
| Provision Elasticsearch (or Amazon OpenSearch) cluster | 🔴 Critical Path | DevOps | `[ ]` |
| Cloudflare zone configuration + WAF rules | 🔴 Critical Path | DevOps | `[ ]` |
| HashiCorp Vault setup + secret injection to EKS | 🔴 Critical Path | DevOps | `[ ]` |
| GitHub Actions CI/CD pipelines (lint, test, build, staging deploy) | 🔴 Critical Path | DevOps | `[ ]` |
| Docker Compose local dev stack | 🟠 High | Platform | `[ ]` |
| Grafana + Prometheus + Jaeger observability stack | 🟠 High | DevOps | `[ ]` |

#### Week 3–4: Core Data Pipeline (Skeleton)

| Task | Priority | Owner | Status |
|---|---|---|---|
| Kafka topic creation + schema registry setup | 🔴 Critical Path | Data Eng | `[ ]` |
| Avro schema definitions: raw_event_v1, processed_event_v1 | 🔴 Critical Path | Data Eng | `[ ]` |
| Collector service skeleton: base class, Kafka publisher | 🔴 Critical Path | Data Eng | `[ ]` |
| Telegram collector (MTProto via Telethon) — target top 20 infostealer channels | 🔴 Critical Path | Data Eng | `[ ]` |
| Paste site collector (Pastebin, Ghostbin, 0bin) | 🟠 High | Data Eng | `[ ]` |
| Processor service skeleton: consumer, pipeline | 🔴 Critical Path | Data Eng | `[ ]` |
| Credential extractor: regex patterns (email:pass, email:hash formats) | 🔴 Critical Path | Data Eng | `[ ]` |
| MinHash LSH deduplication | 🟠 High | Data Eng | `[ ]` |
| SHA-256 email hashing + password masking (Privacy by Design) | 🔴 Critical Path | Data Eng | `[ ]` |
| PostgreSQL schema: initial migration (0001) | 🔴 Critical Path | Platform | `[ ]` |

---

### Month 2 — Matching, Alerting & Dashboard Alpha

| Task | Priority | Owner | Status |
|---|---|---|---|
| Identity service: org registration, JWT auth, API key generation | 🔴 Critical Path | Auth Team | `[ ]` |
| Identity service: RBAC (org:owner, org:admin, org:analyst) | 🟠 High | Auth Team | `[ ]` |
| Matcher service (Go): domain index, keyword index, email hash index | 🔴 Critical Path | Platform | `[ ]` |
| Alert Engine (Go): deduplication (Redis SET NX), severity scoring | 🔴 Critical Path | Platform | `[ ]` |
| Alert → PostgreSQL persistence | 🔴 Critical Path | Platform | `[ ]` |
| Notification service: email dispatcher (AWS SES) | 🔴 Critical Path | Integrations | `[ ]` |
| Notification service: Slack dispatcher (Block Kit) | 🟠 High | Integrations | `[ ]` |
| Notification service: webhook dispatcher (HMAC-SHA256) | 🟠 High | Integrations | `[ ]` |
| Dashboard BFF: alerts list + detail API | 🔴 Critical Path | Platform | `[ ]` |
| Dashboard BFF: WebSocket gateway (Redis Pub/Sub → client) | 🟠 High | Platform | `[ ]` |
| Web app: login, org onboarding wizard | 🔴 Critical Path | Frontend | `[ ]` |
| Web app: alert feed (live, filterable) | 🔴 Critical Path | Frontend | `[ ]` |
| Web app: watchlist management UI | 🔴 Critical Path | Frontend | `[ ]` |
| Web app: alert detail page (source, findings, status controls) | 🔴 Critical Path | Frontend | `[ ]` |
| Domain verification flow: DNS TXT record check | 🟠 High | Platform | `[ ]` |
| REST API v1: /alerts, /watchlist, /org endpoints | 🔴 Critical Path | Platform | `[ ]` |
| OpenAPI 3.0 spec: initial publication | 🟠 High | Platform | `[ ]` |

**Alpha milestone:** Core pipeline processing real Telegram infostealer data and delivering alerts to internal test org.

---

### Month 3 — Private Beta + Billing + Polish

| Task | Priority | Owner | Status |
|---|---|---|---|
| Stripe billing integration: plan creation, checkout, webhooks | 🔴 Critical Path | Auth Team | `[ ]` |
| Plan enforcement: watchlist limits, API rate limits by plan | 🔴 Critical Path | Platform | `[ ]` |
| Tor collector: top ransomware leak sites (50 sites) | 🟠 High | Data Eng | `[ ]` |
| Tor collector: major hacker forums (XSS, Exploit.in) | 🟠 High | Data Eng | `[ ]` |
| GitHub secret scanner integration | 🟠 High | Data Eng | `[ ]` |
| REST API: /search/credentials endpoint | 🟠 High | Platform | `[ ]` |
| REST API: /export/alerts (CSV/JSON) | 🟠 High | Platform | `[ ]` |
| Weekly email digest (automated, per org) | 🟡 Medium | Integrations | `[ ]` |
| KPI dashboard cards: total alerts, critical count, sources monitored | 🔴 Critical Path | Frontend | `[ ]` |
| Alert trend chart (Recharts, 30-day) | 🟡 Medium | Frontend | `[ ]` |
| Onboarding: DNS verification UX, email verification fallback | 🟠 High | Frontend | `[ ]` |
| API Keys management UI | 🟠 High | Frontend | `[ ]` |
| User invite + role management | 🟡 Medium | Frontend | `[ ]` |
| Load testing at 2× expected launch volume (k6) | 🔴 Critical Path | DevOps | `[ ]` |
| Security review: OWASP Top 10, Trivy image scan, Snyk | 🔴 Critical Path | Security | `[ ]` |
| Status page (status.umbra.io via Statuspage.io) | 🟡 Medium | DevOps | `[ ]` |
| Design partner program: onboard 10–50 orgs for beta feedback | 🔴 Critical Path | Founders | `[ ]` |
| Private beta feedback collection + iteration | 🟠 High | Product | `[ ]` |

**Phase 1 exit criteria:**
- [ ] 10+ beta orgs actively monitoring domains
- [ ] Real credential breach alert delivered end-to-end within 60 minutes
- [ ] Zero plaintext credentials persisted (verified by security scan)
- [ ] All P1 bugs resolved; P2 bugs triaged with owners

---

## 4. Phase 2 — Intelligence Layer (Months 4–6)

**Goal:** Transform raw breach alerts into actionable, AI-enriched intelligence. Go from "we found credentials" to "here's exactly what happened, why it matters, and what to do next." Launch publicly, reach 200 paying organizations.

### Month 4 — Public Launch + AI Enrichment

| Task | Priority | Owner | Status |
|---|---|---|---|
| **PUBLIC LAUNCH (v1.0 GA)** | 🔴 Critical Path | All | `[ ]` |
| Product Hunt launch + HackerNews submission | 🔴 Critical Path | Founders | `[ ]` |
| AI threat summarization: Claude API integration (Architecture.md §5) | 🔴 Critical Path | ML Team | `[ ]` |
| LLM prompt templates: summary, severity reasoning, remediation steps | 🟠 High | ML Team | `[ ]` |
| MITRE ATT&CK mapping: rules engine + LLM-assisted tagging | 🟠 High | ML Team | `[ ]` |
| LLM response Redis caching (reduce API cost) | 🟡 Medium | ML Team | `[ ]` |
| XGBoost risk scoring model: training data curation + v1 training | 🟠 High | ML Team | `[ ]` |
| XGBoost model serving in intelligence service | 🟠 High | ML Team | `[ ]` |
| AI summary display in alert detail UI | 🔴 Critical Path | Frontend | `[ ]` |
| Remediation steps UI component | 🟠 High | Frontend | `[ ]` |
| MITRE ATT&CK technique badges in alert detail | 🟡 Medium | Frontend | `[ ]` |
| MLflow model versioning setup | 🟡 Medium | ML Team | `[ ]` |
| FastText content classifier: training + deployment | 🟠 High | ML Team | `[ ]` |
| Alert AI enrichment status polling (async generation) | 🟡 Medium | Platform | `[ ]` |

---

### Month 5 — Dark Forum + Ransomware Coverage

| Task | Priority | Owner | Status |
|---|---|---|---|
| Dark forum monitoring: XSS.is, Exploit.in, BreachForums crawlers | 🟠 High | Data Eng | `[ ]` |
| Forum post Elasticsearch indexing + org keyword matching | 🟠 High | Data Eng | `[ ]` |
| Ransomware leak site monitoring: 200+ active groups | 🟠 High | Data Eng | `[ ]` |
| Alert category: `forum_mention`, `ransomware_listing` in pipeline | 🟠 High | Platform | `[ ]` |
| Multi-source alert feed: filter by category in dashboard | 🟠 High | Frontend | `[ ]` |
| Alert category icons + color coding system | 🟡 Medium | Frontend | `[ ]` |
| MSSP multi-tenant workspace: org switcher, per-client data isolation | 🟠 High | Platform | `[ ]` |
| MSSP dashboard: all clients overview table | 🟡 Medium | Frontend | `[ ]` |
| Executive PDF report generation (Phase 1 of 3) | 🟡 Medium | Platform | `[ ]` |
| POST /v1/reports/generate endpoint + async job | 🟡 Medium | Platform | `[ ]` |
| Microsoft Teams notification dispatcher | 🟡 Medium | Integrations | `[ ]` |
| PagerDuty integration | 🟡 Medium | Integrations | `[ ]` |

---

### Month 6 — SIEM Integrations + Python/Node SDKs

| Task | Priority | Owner | Status |
|---|---|---|---|
| Splunk HEC connector | 🟠 High | Integrations | `[ ]` |
| Elastic SIEM (Bulk API) connector | 🟠 High | Integrations | `[ ]` |
| Microsoft Sentinel (Log Analytics API) connector | 🟡 Medium | Integrations | `[ ]` |
| STIX 2.1 export endpoint (`Accept: application/stix+json`) | 🟠 High | Platform | `[ ]` |
| TAXII 2.1 server implementation | 🟡 Medium | Platform | `[ ]` |
| Python SDK v1 (`pip install umbra-sdk`) | 🔴 Critical Path | Platform | `[ ]` |
| Node.js SDK v1 (`npm install @umbra-io/sdk`) | 🔴 Critical Path | Platform | `[ ]` |
| SDK documentation site (Mintlify/Docusaurus) | 🟠 High | Platform | `[ ]` |
| API playground (interactive Swagger UI at docs.umbra.io) | 🟡 Medium | Platform | `[ ]` |
| Jira integration (auto ticket creation) | 🟡 Medium | Integrations | `[ ]` |
| Integrations management UI (SIEM + Jira config forms) | 🟠 High | Frontend | `[ ]` |
| ClickHouse: alert trend analytics pipeline | 🟠 High | Data Eng | `[ ]` |
| Dashboard: enhanced analytics page (trend charts, source breakdown) | 🟡 Medium | Frontend | `[ ]` |
| Compliance audit log export (CSV/JSON) | 🟡 Medium | Platform | `[ ]` |

**Phase 2 exit criteria:**
- [ ] 200+ paying organizations
- [ ] 100% of alerts include AI summary (or clearly marked "pending")
- [ ] At least 3 SIEM connectors live
- [ ] Python + Node.js SDKs published and documented
- [ ] 5 enterprise leads in pipeline from MSSP outreach

---

## 5. Phase 3 — Visualization & Depth (Months 7–9)

**Goal:** Build the competitive moat features — the 3D Threat Graph, threat actor profiling, automated remediation, and brand protection. Achieve SOC 2 Type II.

### Month 7 — 3D Threat Intelligence Graph

| Task | Priority | Owner | Status |
|---|---|---|---|
| Three.js + React Three Fiber integration (apps/web) | 🔴 Critical Path | Frontend | `[ ]` |
| Threat Graph data model: nodes (actor, campaign, asset, tool) + edges | 🔴 Critical Path | Platform | `[ ]` |
| Graph data API: GET /v1/threat-graph | 🔴 Critical Path | Platform | `[ ]` |
| Force-directed layout engine for graph rendering | 🔴 Critical Path | Frontend | `[ ]` |
| Node: organization asset (domain, email domain) | 🟠 High | Frontend | `[ ]` |
| Node: threat actor profile | 🟠 High | Frontend | `[ ]` |
| Node: alert event (credential breach, forum mention) | 🟠 High | Frontend | `[ ]` |
| Node: malware family | 🟡 Medium | Frontend | `[ ]` |
| Edge: "attributed-to", "used-in", "targets", "exposed" | 🟠 High | Frontend | `[ ]` |
| Graph interactions: zoom, pan, click-to-drill-down, filter | 🟠 High | Frontend | `[ ]` |
| Node tooltip with mini-alert detail | 🟡 Medium | Frontend | `[ ]` |
| WebGL fallback to 2D D3 graph for non-WebGL browsers | 🟡 Medium | Frontend | `[ ]` |
| Performance: node culling + LOD for graphs > 500 nodes | 🟡 Medium | Frontend | `[ ]` |

---

### Month 8 — Threat Actor Profiling + Remediation

| Task | Priority | Owner | Status |
|---|---|---|---|
| Threat actor research pipeline: MITRE CTI, ISAC feeds, UMBRA analyst | 🟠 High | Data Eng | `[ ]` |
| Threat actor DB seeding: top 100 financially-motivated actors | 🟠 High | Data Eng | `[ ]` |
| Threat actor profiles: UI (profile page, TTP timeline, industry targeting) | 🟠 High | Frontend | `[ ]` |
| Alert → threat actor linkage in AI enrichment pipeline | 🟠 High | ML Team | `[ ]` |
| GET /v1/threat-actors endpoints | 🟠 High | Platform | `[ ]` |
| IAB (Initial Access Broker) monitoring: dark market scrapers | 🔵 Research | Data Eng | `[ ]` |
| IAB alert category: `iab_listing` | 🟡 Medium | Platform | `[ ]` |
| Okta SCIM integration: one-click password reset | 🔵 Research | Integrations | `[ ]` |
| Azure AD integration: forced password reset + account lock | 🔵 Research | Integrations | `[ ]` |
| Google Workspace integration: forced password reset | 🔵 Research | Integrations | `[ ]` |
| Remediation workflows UI: one-click IdP actions from alert detail | 🟠 High | Frontend | `[ ]` |
| ServiceNow integration (ticket auto-creation) | 🟡 Medium | Integrations | `[ ]` |
| Brand protection: lookalike domain detection (dnstwist-based) | 🔵 Research | Data Eng | `[ ]` |
| Social media impersonation monitoring (Twitter/X, LinkedIn) | 🔵 Research | Data Eng | `[ ]` |

---

### Month 9 — SOC 2 + Executive Features

| Task | Priority | Owner | Status |
|---|---|---|---|
| **SOC 2 Type II audit kickoff** | 🔴 Critical Path | Founders | `[ ]` |
| SOC 2 evidence collection: access control, encryption, availability | 🔴 Critical Path | Security | `[ ]` |
| Penetration test (external vendor) | 🔴 Critical Path | Security | `[ ]` |
| Immutable audit log verification: S3 WORM compliance check | 🔴 Critical Path | DevOps | `[ ]` |
| Executive / VIP monitoring module | 🟠 High | Data Eng | `[ ]` |
| Personal email + phone exposure alerts (C-suite) | 🟠 High | Data Eng | `[ ]` |
| Executive reporting UI: VIP watchlist management | 🟡 Medium | Frontend | `[ ]` |
| Enhanced PDF reports: trend analysis charts embedded | 🟠 High | Platform | `[ ]` |
| White-label export: customer-branded report covers | 🟡 Medium | Platform | `[ ]` |
| Multi-region: EU data residency enforcement (`eu-west-1`) | 🔴 Critical Path | DevOps | `[ ]` |
| GDPR right-to-erasure: automated org offboarding pipeline | 🔴 Critical Path | Platform | `[ ]` |
| Performance: API response caching layer (Redis) | 🟡 Medium | Platform | `[ ]` |
| Uptime SLA monitoring: Checkly 10-region synthetic checks | 🟡 Medium | DevOps | `[ ]` |
| Chaos engineering: first chaos experiment (pod termination) | 🟡 Medium | DevOps | `[ ]` |

**Phase 3 exit criteria:**
- [ ] 3D Threat Graph live with real data for 500+ paying orgs
- [ ] SOC 2 Type II audit in progress (all controls documented)
- [ ] At least 2 IdP remediation integrations working in production
- [ ] 500+ paying organizations

---

## 6. Phase 4 — Enterprise & Scale (Months 10–12)

**Goal:** Close enterprise deals, launch mobile app, build the partner ecosystem, and prepare for Series A. Scale to 1,000+ paying organizations.

### Month 10 — Enterprise Tier + Mobile Alpha

| Task | Priority | Owner | Status |
|---|---|---|---|
| Enterprise plan: SLA enforcement, dedicated CSM workflows | 🔴 Critical Path | Founders | `[ ]` |
| Enterprise: IP allowlist for API access | 🟠 High | Platform | `[ ]` |
| Enterprise: custom API rate limits | 🟠 High | Platform | `[ ]` |
| Enterprise: SSO / SAML 2.0 (Okta, Azure AD IdP federation) | 🟠 High | Auth Team | `[ ]` |
| Enterprise: custom data retention policies | 🟡 Medium | Platform | `[ ]` |
| White-label solution: custom logo/colors for MSSP portals | 🟠 High | Frontend | `[ ]` |
| White-label: custom report branding | 🟡 Medium | Platform | `[ ]` |
| Mobile app (Expo): alert feed, critical alert push notifications | 🟠 High | Mobile | `[ ]` |
| Mobile app: watchlist management | 🟡 Medium | Mobile | `[ ]` |
| Mobile app: biometric auth | 🟡 Medium | Mobile | `[ ]` |
| Push notification service (Expo Push API) | 🟠 High | Mobile | `[ ]` |
| App Store + Google Play submission | 🟠 High | Mobile | `[ ]` |

---

### Month 11 — Marketplace + Partnership Ecosystem

| Task | Priority | Owner | Status |
|---|---|---|---|
| Integration marketplace UI (browse, install, configure) | 🟡 Medium | Frontend | `[ ]` |
| Splunk Marketplace listing | 🟠 High | Integrations | `[ ]` |
| Microsoft Sentinel Content Hub listing | 🟠 High | Integrations | `[ ]` |
| Okta Integration Network listing | 🟡 Medium | Integrations | `[ ]` |
| Partner API for MSSPs: white-label key management | 🟡 Medium | Platform | `[ ]` |
| Affiliate / referral program | 🟡 Medium | Growth | `[ ]` |
| Custom threat intelligence report service (professional services) | 🟡 Medium | Analysts | `[ ]` |
| Phishing kit detection module (cert transparency + urlscan.io) | 🔵 Research | Data Eng | `[ ]` |
| SOC 2 Type II certification issued | 🔴 Critical Path | Founders | `[ ]` |

---

### Month 12 — Scale, Fundraising & Year 2 Planning

| Task | Priority | Owner | Status |
|---|---|---|---|
| 1,000 paying organizations milestone | 🔴 Critical Path | All | `[ ]` |
| Series A fundraising materials: deck, data room, metrics report | 🔴 Critical Path | Founders | `[ ]` |
| Investor pipeline outreach (target: Tier 1 security VCs) | 🔴 Critical Path | Founders | `[ ]` |
| Annual customer survey + NPS measurement | 🟠 High | Product | `[ ]` |
| Year 2 roadmap planning: customer advisory board session | 🟠 High | Product | `[ ]` |
| Source coverage: reach 5,000+ monitored sources | 🟠 High | Data Eng | `[ ]` |
| AI model refresh: XGBoost retrain on 12 months production data | 🟠 High | ML Team | `[ ]` |
| ClickHouse: real-time executive analytics API | 🟡 Medium | Data Eng | `[ ]` |
| API v2 planning: GraphQL layer, enhanced STIX output | 🔵 Research | Platform | `[ ]` |
| Mobile app v1.0 GA (App Store + Play Store) | 🟠 High | Mobile | `[ ]` |

**Phase 4 exit criteria:**
- [ ] 1,000+ paying organizations
- [ ] $150K+ MRR
- [ ] SOC 2 Type II certified
- [ ] Mobile app live on both stores
- [ ] Series A term sheet in hand or closing

---

## 7. Beyond Year 1 — Vision Backlog

Items tracked for Year 2+ planning — not committed, subject to market feedback:

| Feature | Rationale |
|---|---|
| **GraphQL API layer** | Requested by enterprise customers for flexible querying |
| **Geopolitical risk module** | State-sponsored threat actor tracking (post SOC 2 / legal review) |
| **AI threat analyst chatbot** | "Ask UMBRA" — natural language queries over threat data |
| **Browser extension** | Dark web lookup directly from browser (consumer research tool) |
| **On-premise deployment** | Air-gapped enterprise deployments (requires major architecture work) |
| **Threat intelligence marketplace** | Sell UMBRA-curated IOC feeds to third parties |
| **Acquisition candidate positioning** | Strategic positioning for potential acqui-hire by Palo Alto / CrowdStrike |
| **SOAR native playbooks** | Native playbook builder for automated response orchestration |
| **Autonomous incident responder** | AI agent that self-executes approved remediation steps |

---

## 8. Sprint Cadence & Ceremonies

UMBRA runs **2-week sprints** across all engineering teams.

### Weekly Rhythm

| Day | Event | Participants |
|---|---|---|
| Monday | Sprint kick-off / sprint review (bi-weekly) | All engineering |
| Tuesday | Backend sync | Backend + Data Eng leads |
| Wednesday | Frontend sync | Frontend + Mobile |
| Thursday | Architecture review (bi-weekly) | Tech leads |
| Friday | Demo + retrospective (bi-weekly) | All engineering + product |

### Definition of Done

A feature is **done** when:
1. Code merged to `main` with passing CI (lint, tests, security scan)
2. Deployed to staging; integration tests passing
3. OpenAPI spec updated (if API-facing)
4. Unit test coverage ≥ 80% on new code
5. `Requirements.md` linked requirement marked as implemented
6. Product owner has reviewed in staging
7. Monitoring/alerting configured for new code paths

---

## 9. Dependency Map

```
Phase 1 (Core Pipeline) must complete before:
  └── Phase 2 (AI Enrichment)       ← needs processed events + PostgreSQL alerts
  └── Phase 2 (Forum Monitoring)    ← needs Kafka pipeline + Elasticsearch
  └── Phase 2 (SIEM Integration)    ← needs confirmed alerts structure

Phase 2 (AI Enrichment) must complete before:
  └── Phase 3 (Threat Actor Profiling) ← needs MITRE mapping + LLM output
  └── Phase 3 (3D Graph)               ← needs actor-alert relationships

Phase 2 (MSSP Multi-tenant) must complete before:
  └── Phase 4 (White-label)            ← MSSP workspace is the foundation

Phase 3 (SOC 2 audit kickoff) must complete before:
  └── Phase 4 (Enterprise sales)       ← Enterprises require SOC 2 certification

Phase 1 (Mobile Responsiveness) must complete before:
  └── Phase 4 (Mobile App)             ← Web design tokens shared with React Native
```

---

## 10. Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Tor/dark web access blocked** by hosting provider | Medium | High | Use residential proxies as primary fallback; multiple cloud regions; no single point of egress |
| **Telegram API rate limits** restrict infostealer channel monitoring | High | High | Multiple MTProto accounts with rotation; priority queue for high-signal channels |
| **Claude/LLM API cost spike** at scale | Medium | Medium | Redis response caching; fallback to smaller model for medium/low severity; cost monitoring alerts |
| **False positive rate > 10%** damages trust | Medium | High | Strict deduplication (MinHash LSH); human review queue for borderline matches; customer feedback loop |
| **Legal challenge** from dark web site operator | Low | Very High | Passive monitoring only; no account creation; legal counsel on retainer; `SECURITY.md` policy |
| **GDPR violation** due to PII mishandling | Low | Very High | Privacy-by-design in schema (no plaintext PII); data minimization enforced at pipeline; DPO engaged |
| **Key engineer departure** in Phase 1 | Medium | High | Cross-training; documented architecture (`Architecture.md`); pair programming for critical services |
| **Competitor responds with similar pricing** | Medium | Medium | Speed of execution is moat; focus on quality of AI summaries and 3D graph as differentiators |
| **SOC 2 audit delays** past Month 9 | Medium | High | Start evidence collection Month 6; engage external auditor Month 7; no enterprise deals before certification |
| **AWS outage in primary region** | Low | Very High | Multi-AZ by default; DR runbook; EU region for critical data; RTO < 30 min (`Architecture.md` §13) |

---

## 11. Success Metrics by Phase

### Phase 1 Exit (Month 3)

| Metric | Target |
|---|---|
| Design partner organizations | 10–50 |
| End-to-end alert latency (P50) | < 60 min |
| Zero plaintext credential incidents | 0 |
| Core pipeline unit test coverage | ≥ 80% |
| API uptime (staging) | > 99% |

### Phase 2 Exit (Month 6)

| Metric | Target |
|---|---|
| Paying organizations | 200 |
| MRR | $25,000 |
| Alerts with AI summary | ≥ 95% |
| Alert false positive rate | < 8% |
| Source coverage | 2,000+ |
| SDK installs (combined Python + Node) | 500+ |

### Phase 3 Exit (Month 9)

| Metric | Target |
|---|---|
| Paying organizations | 500 |
| MRR | $75,000 |
| 3D Graph: monthly active users | ≥ 40% of dashboard users |
| SOC 2 Type II audit status | In progress / issued |
| Alert false positive rate | < 5% |
| Enterprise leads in pipeline | 10+ |

### Phase 4 Exit (Month 12)

| Metric | Target |
|---|---|
| Paying organizations | 1,000 |
| MRR | $150,000 |
| ARR | $1.8M |
| Net Revenue Retention | > 110% |
| NPS Score | > 50 |
| Churn Rate (monthly) | < 3% |
| API Requests / Day | 5M+ |
| Source Coverage | 5,000+ |

---

## 12. Go-to-Market Milestones

| Milestone | Timing | Description |
|---|---|---|
| **Private Beta Launch** | Month 3 | 10–50 design partners; focused on SOC analysts and security engineers |
| **Public Launch** | Month 4 | Product Hunt, HackerNews, security Twitter/LinkedIn campaign |
| **Operator Plan GA** | Month 4 | $99/mo self-serve onboarding live |
| **MSSP Program** | Month 5 | Formal MSSP partner program with volume discounts and white-label |
| **Dev Community** | Month 6 | Python + Node.js SDKs + docs site; dev-focused content marketing |
| **Analyst Outreach** | Month 7 | Gartner, Forrester, Omdia briefings; positioning for next Magic Quadrant |
| **Enterprise Beta** | Month 9 | 5 enterprise design partners on $999+/mo contracts |
| **Marketplace Listings** | Month 11 | Splunk, Microsoft, Okta marketplace listings live |
| **Series A Fundraise** | Month 12 | Target: $8–12M from Tier 1 security-focused VC |

---

*Document maintained by: Hardik Bhaskar | UMBRA Intelligence | Roadmap v1.0.0*

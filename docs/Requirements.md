# UMBRA — Requirements Specification

**Version:** 1.0.0
**Author:** Hardik Bhaskar
**Status:** Draft → Review
**Last Updated:** June 2026

---

## Table of Contents
1. [Purpose & Scope](#1-purpose--scope)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [Data Requirements](#4-data-requirements)
5. [Integration Requirements](#5-integration-requirements)
6. [Compliance & Regulatory Requirements](#6-compliance--regulatory-requirements)
7. [System Environment Requirements](#7-system-environment-requirements)
8. [Requirements Traceability Matrix](#8-requirements-traceability-matrix)
9. [Acceptance Criteria Summary](#9-acceptance-criteria-summary)

---

## 1. Purpose & Scope

This document translates UMBRA's PRD (`PRD.md`) into testable engineering requirements. Every requirement carries a unique ID, priority, and acceptance criteria so it can be tracked through design, implementation, and QA. Scope covers the v1.0 MVP through v2.0 (Could Have) feature set defined in the PRD's MoSCoW breakdown.

**Out of scope:** offensive security tooling, physical-world intel, consumer identity products (see PRD §7, Won't Have).

---

## 2. Functional Requirements

### 2.1 Organization Onboarding (maps to PRD M1)

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | User can register an organization with name, primary domain, and industry vertical | Must |
| FR-002 | User can add additional domains, sub-domains, email domains, IP ranges, and brand keywords to a watchlist | Must |
| FR-003 | System validates domain ownership via DNS TXT record or email verification before activating monitoring | Must |
| FR-004 | Free tier limits watchlist to 1 domain / 5 emails; paid tiers enforce plan-specific limits (PRD §10) | Must |
| FR-005 | Onboarding wizard completes in ≤ 5 minutes for a single-domain org (no sales call) | Must |

### 2.2 Credential Breach Detection (PRD M2)

| ID | Requirement | Priority |
|---|---|---|
| FR-010 | System ingests and parses stealer logs, combolists, and breach dumps from configured sources | Must |
| FR-011 | System extracts email:password pairs (plaintext and hashed) and matches against monitored domains | Must |
| FR-012 | Each detection captures: harvest date, source type, malware family (e.g., RedLine, Raccoon, Lumma), record count | Must |
| FR-013 | System deduplicates recycled/recompiled breach data using content fingerprinting (MinHash LSH) | Must |
| FR-014 | Plaintext credentials are hashed (SHA-256) and passwords partially masked before persistence — never stored raw | Must |

### 2.3 Alert Engine (PRD M3)

| ID | Requirement | Priority |
|---|---|---|
| FR-020 | System generates an alert within 60 minutes (P50 < 45 min) of a confirmed match against a watchlist | Must |
| FR-021 | Alerts are deduplicated against previously delivered alerts for the same credential/source pair | Must |
| FR-022 | Each alert is assigned a severity: Critical / High / Medium / Low, per the Risk Scoring Model (`Architecture.md` §5) | Must |
| FR-023 | Alerts deliverable via Email, Slack, Microsoft Teams, and signed Webhook (HMAC-SHA256) | Must |
| FR-024 | User can configure per-severity routing rules (e.g., Critical → PagerDuty, Medium → Slack only) | Should |

### 2.4 Threat Feed Dashboard (PRD M4)

| ID | Requirement | Priority |
|---|---|---|
| FR-030 | Dashboard displays a real-time, filterable feed of all threat events for the active organization | Must |
| FR-031 | Feed is filterable by source type, severity, date range, and threat category | Must |
| FR-032 | User can transition an alert's status: New → In Progress → Resolved / False Positive | Must |
| FR-033 | Dashboard updates in real time via WebSocket without requiring page refresh | Must |

### 2.5 REST API (PRD M5)

| ID | Requirement | Priority |
|---|---|---|
| FR-040 | Full CRUD coverage for watchlists, alerts, and org settings via REST API | Must |
| FR-041 | API authenticated via scoped API keys (`api:read`, `api:write`) with per-key rate limiting | Must |
| FR-042 | OpenAPI 3.0 spec published and kept in sync with deployed API version | Must |
| FR-043 | API supports cursor-based pagination on all list endpoints | Must |

### 2.6 Reporting (PRD M6, extended by C-tier)

| ID | Requirement | Priority |
|---|---|---|
| FR-050 | Weekly digest email summarizing new findings, resolved items, and trend deltas | Must |
| FR-051 | CSV/JSON export of all findings for a selected date range | Must |
| FR-052 | One-click executive PDF report generation (org posture, trend charts, top risks) | Should |
| FR-053 | Immutable audit-log export for compliance review (SOC 2 / GDPR) | Should |

### 2.7 AI Intelligence Layer (PRD S1)

| ID | Requirement | Priority |
|---|---|---|
| FR-060 | Every alert includes an LLM-generated plain-English summary and source context | Should |
| FR-061 | LLM output includes 3 prioritized remediation steps and relevant MITRE ATT&CK technique IDs | Should |
| FR-062 | LLM enrichment failures degrade gracefully — alert still delivers with raw data, summary marked "pending" | Should |

### 2.8 Multi-Source Monitoring (PRD S2–S4)

| ID | Requirement | Priority |
|---|---|---|
| FR-070 | Monitor dark forums/marketplaces for brand, domain, and executive name mentions | Should |
| FR-071 | Monitor 200+ ransomware leak sites for org appearing as a named victim | Should |
| FR-072 | Monitor 50+ paste sites and public Git repos for exposed secrets/API keys tied to monitored domains | Should |

### 2.9 MSSP & Enterprise (PRD S5–S6, C1–C6)

| ID | Requirement | Priority |
|---|---|---|
| FR-080 | Multi-tenant workspace: one MSSP login manages N client orgs with isolated data per client | Should |
| FR-081 | Native SIEM connectors (Splunk, Elastic, Sentinel) and STIX/TAXII 2.1 export | Should |
| FR-090 | Interactive 3D threat graph visualizing actor ↔ campaign ↔ asset relationships | Could |
| FR-091 | Persistent threat actor profiles with historical activity and MITRE ATT&CK TTP mapping | Could |
| FR-092 | One-click remediation: forced password reset via Okta/Azure AD/Google Workspace | Could |

---

## 3. Non-Functional Requirements

| Category | ID | Requirement | Target |
|---|---|---|---|
| **Performance** | NFR-01 | API latency (P95) | < 300ms |
| | NFR-02 | Dashboard initial load (P75) | < 2s |
| | NFR-03 | Alert delivery latency (P50 / P95) | < 45min / < 60min |
| **Scalability** | NFR-04 | Concurrent organizations supported at launch | 5,000+ |
| | NFR-05 | Ingestion throughput | 10,000+ events/sec sustained |
| | NFR-06 | Horizontal auto-scale on collector/matcher services | 3–12 replicas per `Architecture.md` §11 |
| **Availability** | NFR-07 | Platform uptime SLO | 99.9% |
| | NFR-08 | Collection pipeline uptime | 99.5% |
| **Security** | NFR-09 | All data in transit encrypted | TLS 1.3 |
| | NFR-10 | All data at rest encrypted | AES-256 |
| | NFR-11 | No plaintext credential persisted beyond active processing window | 0 instances (hard constraint) |
| | NFR-12 | Service-to-service auth | mTLS, zero implicit trust |
| **Usability** | NFR-13 | Time-to-first-alert-value (onboarding → first dashboard view) | < 5 min |
| | NFR-14 | WCAG conformance for web dashboard | WCAG 2.1 AA |
| **Maintainability** | NFR-15 | Test coverage (unit) on core services | ≥ 80% |
| | NFR-16 | API backward compatibility window | 18 months per version |
| **Reliability** | NFR-17 | False positive rate on alerts | < 5% by Month 12 |
| | NFR-18 | RTO / RPO for full region failure | < 30 min / < 15 min (`Architecture.md` §13) |

---

## 4. Data Requirements

- **Classification:** All ingested data is tagged at collection time as `raw-pii`, `credential`, `metadata`, or `public-osint`.
- **Minimization:** Only domain + salted hash retained for credentials; full plaintext is processed in-memory and discarded (`Architecture.md` §10).
- **Retention:** Per the schedule in `Architecture.md` §7 (raw content 30 days, processed events 2 years, alerts 5 years, audit logs 7 years).
- **Residency:** EU-origin org data must remain in `eu-west-1`; data residency tag enforced at the database row level.
- **Lineage:** Every alert must be traceable back to its originating raw event hash for audit purposes.

---

## 5. Integration Requirements

| Integration Type | Required Connectors | Protocol |
|---|---|---|
| Messaging | Slack, Microsoft Teams | Bot API / Webhook |
| Ticketing | Jira, ServiceNow | REST API v3 |
| SIEM | Splunk, Elastic SIEM, Microsoft Sentinel | HEC / Bulk API / Log Analytics API |
| Identity | Okta, Azure AD, Google Workspace | SCIM 2.0, OAuth 2.0 |
| Threat Intel Sharing | STIX/TAXII 2.1 | TAXII server |
| Billing | Stripe | REST API + Webhooks |
| Generic | Customer webhooks | HTTPS POST, HMAC-SHA256 signed payloads |

---

## 6. Compliance & Regulatory Requirements

| Requirement | Standard | Notes |
|---|---|---|
| Data protection | GDPR | EU data residency, right to erasure on org offboarding |
| Consumer privacy | CCPA | Applies to any California-resident PII incidentally captured |
| Security certification | SOC 2 Type II | Target: Month 9 (PRD §5, G5) |
| Payment data | PCI DSS | Scope limited to Stripe-hosted checkout; no card data touches UMBRA infra |
| Legal posture | Defensive-only | No offensive ops, no criminal-forum account creation (`Architecture.md` §1, PRD §12) |

---

## 7. System Environment Requirements

| Environment | Purpose | Notes |
|---|---|---|
| **Local** | Developer workstations | Docker Compose stack mirroring core services |
| **Dev** | Integration testing | Shared EKS namespace, synthetic data only |
| **Staging** | Pre-prod validation | Full topology, anonymized production-shaped data |
| **Production** | Live customer traffic | Multi-AZ, multi-region (`us-east-1` + `eu-west-1`) |

**Supported browsers (Dashboard):** Latest 2 versions of Chrome, Edge, Firefox, Safari.
**Supported API clients:** Any HTTPS-capable client; official SDKs for Python ≥ 3.9 and Node.js ≥ 18 LTS.

---

## 8. Requirements Traceability Matrix

| PRD Feature ID | Feature | Linked FRs |
|---|---|---|
| M1 | Org Onboarding & Asset Registration | FR-001–FR-005 |
| M2 | Credential Breach Detection | FR-010–FR-014 |
| M3 | Alert Engine | FR-020–FR-024 |
| M4 | Threat Feed Dashboard | FR-030–FR-033 |
| M5 | REST API | FR-040–FR-043 |
| M6 | Basic Reporting | FR-050–FR-051 |
| S1 | AI Threat Summarization | FR-060–FR-062 |
| S2–S4 | Forum / Leak Site / Paste Monitoring | FR-070–FR-072 |
| S5–S6 | MSSP & SIEM | FR-080–FR-081 |
| C1, C2, C3 | 3D Graph, Actor Profiling, Remediation | FR-090–FR-092 |

---

## 9. Acceptance Criteria Summary

A feature is considered **release-ready** only when:
1. All linked FRs pass automated test coverage (unit + integration).
2. Associated NFR targets are validated under load test (k6 / Locust) at 2× expected launch traffic.
3. Security review confirms no plaintext PII persistence (NFR-11) via static + dynamic scan.
4. Feature is documented in the OpenAPI spec (if API-facing) and in user-facing docs.
5. Product sign-off against the originating PRD MoSCoW item.

---

*Document maintained by: Hardik Bhaskar | UMBRA Intelligence | Requirements v1.0.0*

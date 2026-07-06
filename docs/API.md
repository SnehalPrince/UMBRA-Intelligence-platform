# UMBRA — API Reference

> REST API v1 | OpenAPI 3.0 Compliant | Base URL: `https://api.umbra.io/v1`

**Version:** 1.0.0  
**Author:** Hardik Bhaskar  
**Status:** Draft → Review  
**Last Updated:** June 2026

---

## Table of Contents

1. [API Philosophy & Design Principles](#1-api-philosophy--design-principles)
2. [Authentication](#2-authentication)
3. [Rate Limiting](#3-rate-limiting)
4. [Request & Response Conventions](#4-request--response-conventions)
5. [Error Codes](#5-error-codes)
6. [Endpoints — Organization & Watchlist](#6-endpoints--organization--watchlist)
7. [Endpoints — Alerts](#7-endpoints--alerts)
8. [Endpoints — Breach Search](#8-endpoints--breach-search)
9. [Endpoints — Threat Intelligence](#9-endpoints--threat-intelligence)
10. [Endpoints — Reporting](#10-endpoints--reporting)
11. [Endpoints — Integrations & Webhooks](#11-endpoints--integrations--webhooks)
12. [Endpoints — Admin & Identity](#12-endpoints--admin--identity)
13. [WebSocket API](#13-websocket-api)
14. [SDK Quick Reference](#14-sdk-quick-reference)
15. [Versioning & Deprecation](#15-versioning--deprecation)
16. [OpenAPI Specification Snippet](#16-openapi-specification-snippet)

---

## 1. API Philosophy & Design Principles

UMBRA's API is designed to be the **primary interface** to the platform — the dashboard and internal services consume the same API endpoints customers use ("API-first" per `Architecture.md` §1 and `PRD.md` §5 M5).

| Principle | Implementation |
|---|---|
| **REST + JSON** | All resources are RESTful nouns; JSON request/response bodies |
| **Predictable** | Consistent field naming (snake_case), consistent pagination, consistent error shapes |
| **Cursor-Paginated** | All list endpoints use opaque `cursor` tokens — no offset pagination |
| **Idempotent writes** | PUT/PATCH are idempotent; POST-create returns `409` on duplicate |
| **Hypermedia hints** | Responses include `_links` where navigation between resources is meaningful |
| **OpenAPI-first** | Spec is the source of truth; server stubs and client SDKs are generated from it |
| **Backward compatible** | All additive changes (new fields, new endpoints) are non-breaking; removals bump version |

---

## 2. Authentication

### API Key Authentication

All API requests must include a scoped API key in the `Authorization` header:

```http
Authorization: Bearer umbra_live_sk_xxxxxxxxxxxxxxxxxxxx
```

#### Key Scopes

| Scope | Description | Allowed Operations |
|---|---|---|
| `api:read` | Read-only access to org data | GET on all resources |
| `api:write` | Full watchlist + alert management | GET, POST, PUT, PATCH, DELETE on watchlists, alert status |
| `api:admin` | Org management, user provisioning | All operations including user management (Enterprise) |

#### Key Lifecycle

```
POST /v1/auth/api-keys          → Create new API key (returns raw key once only)
GET  /v1/auth/api-keys          → List keys (masked, metadata only)
DELETE /v1/auth/api-keys/{id}   → Revoke key
```

**Key format:**
```
umbra_{env}_{scope}_{32-char-random}
  ↑         ↑       ↑
  live/test  sk/pk   CSPRNG-generated
```

### JWT Bearer (Dashboard / OAuth flows)

For browser-based dashboard sessions, short-lived JWTs (15-min TTL, RS256) are issued after OAuth 2.0 / password login. The BFF layer exchanges JWTs transparently — external API consumers should always use API keys.

---

## 3. Rate Limiting

Rate limits are enforced per API key (not per IP) at the Kong Gateway layer (`Architecture.md` §8).

| Plan | Requests / minute | Requests / month | Burst |
|---|---|---|---|
| **Scout** (Free) | 10 req/min | — (manual lookups only) | 15 |
| **Operator** | 60 req/min | 10,000 | 100 |
| **Sentinel** | 300 req/min | 100,000 | 500 |
| **Guardian** | 1,000 req/min | Unlimited | 2,000 |
| **Enterprise** | Custom | Custom | Custom |

### Rate Limit Headers

Every response includes:

```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 247
X-RateLimit-Reset: 1750000060
X-RateLimit-Window: 60
Retry-After: 13          ← Only present on 429 responses
```

When the limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 300 req/min exceeded. Retry after 13 seconds.",
    "retry_after_seconds": 13,
    "docs_url": "https://docs.umbra.io/api/rate-limiting"
  }
}
```

---

## 4. Request & Response Conventions

### Base URL

```
Production:  https://api.umbra.io/v1
Staging:     https://api.staging.umbra.io/v1
Local dev:   http://localhost:8080/v1
```

### Request Format

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer umbra_live_sk_...
X-Umbra-Org-ID: org_01J8X4K9M3QVPN2T    ← Required for MSSP multi-tenant calls
Idempotency-Key: <uuid>                   ← Recommended for POST operations
```

### Pagination

All list endpoints use **cursor-based pagination**:

```json
{
  "data": [...],
  "pagination": {
    "cursor": "eyJpZCI6Im9yZ18wMSJ9",
    "has_more": true,
    "total_count": 1423,
    "limit": 50
  },
  "_links": {
    "next": "https://api.umbra.io/v1/alerts?cursor=eyJpZCI6Im9yZ18wMSJ9&limit=50",
    "self": "https://api.umbra.io/v1/alerts?limit=50"
  }
}
```

**Query parameters:**
- `limit` — Items per page (default: `50`, max: `500`)
- `cursor` — Opaque token from previous response
- `sort` — Field to sort by (e.g., `detected_at`)
- `order` — `asc` or `desc` (default: `desc`)

### Timestamps

All timestamps are **ISO 8601 in UTC**: `2026-06-15T14:23:11Z`

### Field Naming

- Request/response fields: `snake_case`
- Resource IDs: prefixed by type + underscore (e.g., `org_`, `alert_`, `evt_`)
- IDs are ULID-formatted: `01J8X4K9M3QVPN2T` (sortable, URL-safe)

---

## 5. Error Codes

All errors follow a consistent schema:

```json
{
  "error": {
    "code": "WATCHLIST_LIMIT_EXCEEDED",
    "message": "Your Scout plan allows 1 domain. Upgrade to Operator to add more.",
    "field": "domain",
    "request_id": "req_01J8X4KAABC123",
    "docs_url": "https://docs.umbra.io/errors/WATCHLIST_LIMIT_EXCEEDED"
  }
}
```

### HTTP Status Codes

| Status | Meaning | When |
|---|---|---|
| `200 OK` | Success | GET, PATCH, PUT |
| `201 Created` | Resource created | POST |
| `204 No Content` | Success, no body | DELETE |
| `400 Bad Request` | Invalid request body or parameters | Missing required fields, type errors |
| `401 Unauthorized` | Missing or invalid API key | No/invalid `Authorization` header |
| `403 Forbidden` | Insufficient key scope | `api:read` key attempting a write |
| `404 Not Found` | Resource doesn't exist or org-scoped 403 | Any lookup by ID |
| `409 Conflict` | Duplicate resource | Creating a domain already in watchlist |
| `422 Unprocessable Entity` | Business logic validation failure | Domain not verified, plan limit exceeded |
| `429 Too Many Requests` | Rate limit hit | See §3 |
| `500 Internal Server Error` | Unexpected server fault | Always includes `request_id` for support |
| `503 Service Unavailable` | Downstream dependency failure | Transient; retry with exponential backoff |

### Application Error Codes

| Code | HTTP | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | API key missing, expired, or malformed |
| `FORBIDDEN` | 403 | Key scope insufficient for operation |
| `ORG_NOT_FOUND` | 404 | Org ID not found or not accessible by this key |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource ID does not exist |
| `DOMAIN_NOT_VERIFIED` | 422 | Domain added but ownership verification pending |
| `WATCHLIST_LIMIT_EXCEEDED` | 422 | Plan limit for domains/emails reached |
| `DUPLICATE_DOMAIN` | 409 | Domain already present in watchlist |
| `INVALID_CURSOR` | 400 | Pagination cursor is malformed or expired |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded (see `Retry-After` header) |
| `LLM_ENRICHMENT_UNAVAILABLE` | 200* | Alert delivered; AI summary generation failed (degraded gracefully) |
| `WEBHOOK_DELIVERY_FAILED` | 200* | Alert stored; webhook unreachable (retry queue active) |

---

## 6. Endpoints — Organization & Watchlist

### Organizations

#### `GET /v1/org`
Retrieve the current organization profile.

**Response `200`:**
```json
{
  "data": {
    "id": "org_01J8X4K9M3QVPN2T",
    "name": "Acme Corp",
    "plan": "sentinel",
    "primary_domain": "acme.com",
    "industry": "financial_services",
    "created_at": "2026-01-15T09:00:00Z",
    "monitoring_active": true,
    "asset_counts": {
      "domains": 4,
      "email_domains": 2,
      "ip_ranges": 1,
      "keywords": 12
    },
    "limits": {
      "domains": 10,
      "email_domains": 10,
      "keywords": 100
    }
  }
}
```

---

#### `PATCH /v1/org`
Update organization profile fields.

**Request body:**
```json
{
  "name": "Acme Corporation",
  "industry": "financial_services",
  "notification_email": "security@acme.com"
}
```

---

### Watchlist

#### `GET /v1/watchlist`
List all monitored assets for the organization.

**Query params:** `type` (filter by: `domain`, `email_domain`, `ip_range`, `keyword`), `status` (filter by: `active`, `pending_verification`)

**Response `200`:**
```json
{
  "data": [
    {
      "id": "wl_01J8X4KBCD234",
      "type": "domain",
      "value": "acme.com",
      "status": "active",
      "verified_at": "2026-01-15T09:12:00Z",
      "monitoring_since": "2026-01-15T09:12:00Z",
      "alert_count_30d": 7
    },
    {
      "id": "wl_01J8X4KBEF345",
      "type": "keyword",
      "value": "Acme Corp breach",
      "status": "active",
      "alert_count_30d": 2
    }
  ],
  "pagination": { "cursor": null, "has_more": false, "total_count": 6 }
}
```

---

#### `POST /v1/watchlist`
Add a new asset to the watchlist.

**Request body:**
```json
{
  "type": "domain",
  "value": "acme-staging.com",
  "label": "Staging environment domain"
}
```

**Response `201`:**
```json
{
  "data": {
    "id": "wl_01J8X4KBGH456",
    "type": "domain",
    "value": "acme-staging.com",
    "status": "pending_verification",
    "verification": {
      "method": "dns_txt",
      "record_name": "_umbra-verify.acme-staging.com",
      "record_value": "umbra-v=01J8X4KBGH456",
      "expires_at": "2026-07-15T09:00:00Z"
    }
  }
}
```

---

#### `DELETE /v1/watchlist/{id}`
Remove an asset from the watchlist. Stops all monitoring for this asset immediately.

**Response `204`** (no body)

---

#### `POST /v1/watchlist/{id}/verify`
Manually trigger domain ownership re-verification check.

---

## 7. Endpoints — Alerts

### Alert Object

```json
{
  "id": "alert_01J8X4KC123",
  "org_id": "org_01J8X4K9M3QVPN2T",
  "severity": "critical",
  "category": "credential_breach",
  "status": "new",
  "title": "47 employee credentials found in RedLine stealer log",
  "detected_at": "2026-06-15T14:23:11Z",
  "source": {
    "type": "telegram_channel",
    "name": "combolists_2026",
    "tier": 1,
    "url_hint": "tg://channel/XXXXX"
  },
  "matched_assets": [
    { "watchlist_id": "wl_01J8X4KBCD234", "value": "acme.com", "type": "domain" }
  ],
  "findings": {
    "credential_count": 47,
    "malware_family": "RedLine",
    "harvest_date_estimate": "2026-06-14T00:00:00Z",
    "sample_hashes": ["sha256:0a7f...", "sha256:1b8e..."]
  },
  "risk_score": 91,
  "ai_summary": {
    "status": "ready",
    "text": "47 credentials associated with acme.com were found in a fresh RedLine stealer log posted to a Telegram channel approximately 14 hours after harvesting. RedLine is a commodity infostealer distributed via malvertising campaigns targeting Windows users. Affected accounts are at immediate risk of account takeover.",
    "severity_reasoning": "Critical: Fresh stealer log (Tier 1 source), high volume (47 records), and RedLine is actively weaponized within 24–72 hours of harvest.",
    "remediation_steps": [
      "1. Immediately force password resets for all 47 affected accounts via your IdP (Okta/Azure AD).",
      "2. Enable or enforce MFA on all affected accounts if not already active.",
      "3. Review authentication logs for the past 48 hours for signs of unauthorized access from unfamiliar IPs."
    ],
    "mitre_techniques": ["T1078.002", "T1555.003"]
  },
  "created_at": "2026-06-15T14:24:02Z",
  "updated_at": "2026-06-15T14:24:02Z"
}
```

---

#### `GET /v1/alerts`
List all alerts for the organization.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `severity` | `string` | Filter: `critical`, `high`, `medium`, `low` |
| `status` | `string` | Filter: `new`, `in_progress`, `resolved`, `false_positive` |
| `category` | `string` | Filter: `credential_breach`, `forum_mention`, `ransomware_listing`, `paste_exposure`, `iab_listing` |
| `since` | `ISO 8601` | Filter alerts detected after this timestamp |
| `until` | `ISO 8601` | Filter alerts detected before this timestamp |
| `watchlist_id` | `string` | Filter by specific monitored asset |
| `limit` | `integer` | Items per page (default: 50, max: 500) |
| `cursor` | `string` | Pagination cursor |

**Response `200`:** Paginated list of Alert objects.

---

#### `GET /v1/alerts/{id}`
Retrieve a single alert with full detail including AI summary.

---

#### `PATCH /v1/alerts/{id}/status`
Update alert triage status.

**Request body:**
```json
{
  "status": "resolved",
  "resolution_note": "Password resets completed for all 47 accounts at 15:00 UTC."
}
```

**Response `200`:** Updated Alert object.

---

#### `POST /v1/alerts/{id}/dispatch`
Manually re-dispatch an alert to configured notification channels.

**Request body:**
```json
{
  "channels": ["slack", "email"],
  "note": "Escalating to CISO for review"
}
```

---

#### `GET /v1/alerts/stats`
Alert statistics for the active organization.

**Query params:** `period` (`7d`, `30d`, `90d`, `1y`)

**Response `200`:**
```json
{
  "data": {
    "period": "30d",
    "total": 42,
    "by_severity": {
      "critical": 3,
      "high": 12,
      "medium": 19,
      "low": 8
    },
    "by_category": {
      "credential_breach": 28,
      "paste_exposure": 9,
      "forum_mention": 4,
      "ransomware_listing": 1
    },
    "resolved_rate": 0.76,
    "avg_time_to_resolve_hours": 4.2,
    "false_positive_rate": 0.048
  }
}
```

---

## 8. Endpoints — Breach Search

One-off, on-demand breach lookup endpoints — useful for CI/CD pipeline integrations and manual investigative queries.

#### `POST /v1/search/credentials`
Search for credentials matching a given email or domain across UMBRA's breach database.

**Scopes required:** `api:read`

**Request body:**
```json
{
  "type": "email_domain",
  "value": "acme.com",
  "include_historical": true
}
```

**Response `200`:**
```json
{
  "data": {
    "query": { "type": "email_domain", "value": "acme.com" },
    "total_breaches_found": 312,
    "breach_summary": [
      {
        "breach_id": "brc_01J8X4KD789",
        "source_type": "stealer_log",
        "malware_family": "RedLine",
        "record_count": 47,
        "detected_at": "2026-06-15T14:23:11Z",
        "severity": "critical",
        "linked_alert_id": "alert_01J8X4KC123"
      }
    ],
    "oldest_breach": "2023-11-02T00:00:00Z",
    "newest_breach": "2026-06-15T14:23:11Z"
  },
  "pagination": { "cursor": "eyJ...", "has_more": true, "total_count": 312 }
}
```

> **Privacy note:** Individual email addresses in results are returned as SHA-256 hashes only. Full email lookup is available only for your verified watchlist domains.

---

#### `POST /v1/search/paste`
Search paste site archives for matches to a domain, keyword, or IP.

**Request body:**
```json
{
  "query": "acme.com api_key",
  "query_type": "keyword",
  "date_range": { "since": "2026-01-01T00:00:00Z" }
}
```

---

#### `POST /v1/search/dark-forum`
Search indexed dark forum posts for mentions of a brand, domain, or executive name.

**Scopes required:** `api:read` (Sentinel plan+)

---

## 9. Endpoints — Threat Intelligence

#### `GET /v1/threat-actors`
List tracked threat actor profiles relevant to your industry vertical.

**Response `200`:**
```json
{
  "data": [
    {
      "id": "ta_01J8X4KE012",
      "name": "ShadowSpider",
      "aliases": ["SS_Team", "spider_collective"],
      "motivation": "financial",
      "active_since": "2024-03-01",
      "primary_ttps": ["T1078", "T1190", "T1486"],
      "targeted_industries": ["financial_services", "healthcare"],
      "recent_activity_at": "2026-06-10T00:00:00Z",
      "relevance_score": 0.87
    }
  ]
}
```

---

#### `GET /v1/threat-actors/{id}`
Full profile for a specific threat actor including historical campaign timeline and MITRE ATT&CK mapping.

---

#### `GET /v1/threat-actors/{id}/mentions`
Alerts where this threat actor is associated with findings for your organization.

---

#### `GET /v1/ransomware-groups`
List monitored ransomware groups and their current leak site status.

---

#### `GET /v1/ioc`
Retrieve indicators of compromise (IOCs) associated with recent alerts.

**Query params:** `type` (`ip`, `domain`, `hash`, `url`), `since`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "ioc_01J8X4KF345",
      "type": "ip",
      "value": "185.220.101.45",
      "context": "Tor exit node used in credential stuffing campaign",
      "confidence": 0.92,
      "first_seen": "2026-06-01T00:00:00Z",
      "last_seen": "2026-06-15T12:00:00Z",
      "mitre_techniques": ["T1090.003"],
      "related_alert_ids": ["alert_01J8X4KC123"]
    }
  ]
}
```

---

#### `GET /v1/threat-feed`
Paginated raw threat intelligence feed from all monitored sources (Sentinel plan+). Useful for SIEM ingestion.

**Supports:** STIX 2.1 output via `Accept: application/stix+json` header.

---

## 10. Endpoints — Reporting

#### `POST /v1/reports/generate`
Trigger generation of a threat intelligence report.

**Request body:**
```json
{
  "type": "executive_summary",
  "period": "30d",
  "format": "pdf",
  "include_sections": ["breach_summary", "trend_analysis", "top_risks", "remediation_status"]
}
```

**Available report types:**

| Type | Description | Plans |
|---|---|---|
| `executive_summary` | Board-ready threat posture overview | Sentinel+ |
| `full_incident_log` | All findings with full detail | Operator+ |
| `compliance_audit` | SOC 2 / GDPR audit-ready log | Guardian+ |
| `threat_actor_brief` | Profile and relevance report on specific actor | Sentinel+ |
| `weekly_digest` | Automated weekly summary (also sent by email) | All plans |

**Response `202 Accepted`:**
```json
{
  "data": {
    "report_id": "rpt_01J8X4KG678",
    "status": "generating",
    "estimated_ready_at": "2026-06-15T15:00:00Z",
    "poll_url": "https://api.umbra.io/v1/reports/rpt_01J8X4KG678"
  }
}
```

---

#### `GET /v1/reports/{id}`
Check report status and retrieve download URL.

**Response `200`:**
```json
{
  "data": {
    "report_id": "rpt_01J8X4KG678",
    "status": "ready",
    "format": "pdf",
    "generated_at": "2026-06-15T14:58:22Z",
    "download_url": "https://api.umbra.io/v1/reports/rpt_01J8X4KG678/download",
    "expires_at": "2026-06-22T14:58:22Z",
    "size_bytes": 482301
  }
}
```

---

#### `GET /v1/reports/{id}/download`
Stream the report file (PDF/CSV/JSON). Returns signed S3 redirect.

---

#### `GET /v1/export/alerts`
Export raw alert data in CSV or JSON format.

**Query params:** `format` (`csv`, `json`, `stix`), `since`, `until`, `severity`

---

## 11. Endpoints — Integrations & Webhooks

#### `GET /v1/integrations`
List all configured integrations for the organization.

---

#### `POST /v1/integrations/webhooks`
Create a new webhook endpoint for alert delivery.

**Request body:**
```json
{
  "name": "SOAR Platform Webhook",
  "url": "https://your-soar.example.com/umbra-ingest",
  "secret": "your-hmac-signing-secret",
  "events": ["alert.new", "alert.status_changed"],
  "severity_filter": ["critical", "high"],
  "active": true
}
```

**Response `201`:**
```json
{
  "data": {
    "id": "wh_01J8X4KH901",
    "name": "SOAR Platform Webhook",
    "url": "https://your-soar.example.com/umbra-ingest",
    "events": ["alert.new", "alert.status_changed"],
    "active": true,
    "created_at": "2026-06-15T15:00:00Z"
  }
}
```

---

### Webhook Payload

All webhook deliveries use HTTPS POST with:

```http
Content-Type: application/json
X-Umbra-Signature: sha256=hmac_hex_signature
X-Umbra-Event: alert.new
X-Umbra-Delivery-ID: del_01J8X4KI234
X-Umbra-Timestamp: 1750000000
```

**Webhook event payload:**
```json
{
  "event": "alert.new",
  "delivery_id": "del_01J8X4KI234",
  "timestamp": "2026-06-15T15:00:00Z",
  "org_id": "org_01J8X4K9M3QVPN2T",
  "data": {
    "alert": { /* Full Alert object */ }
  }
}
```

**Signature verification (Python):**
```python
import hmac, hashlib

def verify_webhook(payload_bytes: bytes, signature_header: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    received = signature_header.removeprefix("sha256=")
    return hmac.compare_digest(expected, received)
```

---

#### `POST /v1/integrations/webhooks/{id}/test`
Send a test event to a configured webhook to verify delivery.

---

#### `POST /v1/integrations/slack`
Configure Slack workspace integration via OAuth.

---

#### `POST /v1/integrations/siem`
Configure a native SIEM connector (Splunk, Elastic, Sentinel).

**Request body:**
```json
{
  "type": "splunk_hec",
  "name": "Production Splunk",
  "config": {
    "hec_url": "https://splunk.acme.com:8088/services/collector",
    "hec_token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "index": "umbra_threats",
    "sourcetype": "umbra:alert"
  },
  "severity_filter": ["critical", "high"]
}
```

---

## 12. Endpoints — Admin & Identity

### Users

#### `GET /v1/users`
List users in the organization.

**Response `200`:**
```json
{
  "data": [
    {
      "id": "usr_01J8X4KJ567",
      "email": "sara@acme.com",
      "name": "Sara Mitchell",
      "role": "org:analyst",
      "mfa_enabled": true,
      "last_login_at": "2026-06-15T08:30:00Z",
      "created_at": "2026-02-01T00:00:00Z"
    }
  ]
}
```

---

#### `POST /v1/users/invite`
Invite a new user to the organization.

**Request body:**
```json
{
  "email": "dave@acme.com",
  "role": "org:analyst",
  "message": "Welcome to UMBRA!"
}
```

---

#### `PATCH /v1/users/{id}`
Update a user's role.

---

#### `DELETE /v1/users/{id}`
Remove a user from the organization (deprovision).

---

### API Keys

#### `GET /v1/auth/api-keys`
List all API keys for the org (masked — raw key is shown only at creation).

#### `POST /v1/auth/api-keys`
Create a new API key.

**Request body:**
```json
{
  "name": "CI/CD Pipeline Key",
  "scope": "api:read",
  "expires_at": "2027-06-15T00:00:00Z"
}
```

**Response `201`:**
```json
{
  "data": {
    "id": "key_01J8X4KK890",
    "name": "CI/CD Pipeline Key",
    "scope": "api:read",
    "key": "umbra_live_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "created_at": "2026-06-15T15:30:00Z",
    "expires_at": "2027-06-15T00:00:00Z"
  },
  "_warning": "Store this key securely. It will not be shown again."
}
```

---

### Audit Log

#### `GET /v1/audit-log`
Retrieve immutable audit log entries for compliance review.

**Query params:** `since`, `until`, `actor_id`, `event_type`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "aud_01J8X4KL123",
      "timestamp": "2026-06-15T15:30:00Z",
      "actor": { "id": "usr_01J8X4KJ567", "email": "sara@acme.com" },
      "event_type": "alert.status_changed",
      "resource": { "type": "alert", "id": "alert_01J8X4KC123" },
      "changes": { "status": { "from": "new", "to": "resolved" } },
      "ip_address": "203.0.113.45",
      "user_agent": "Mozilla/5.0 ..."
    }
  ]
}
```

---

## 13. WebSocket API

Real-time alert delivery to open dashboard sessions via WebSocket (`Architecture.md` §9).

### Connection

```
wss://api.umbra.io/v1/ws?token=<jwt_token>
```

### Authentication

Send an `auth` message immediately after connecting:

```json
{
  "type": "auth",
  "token": "<short-lived-jwt>"
}
```

Server acknowledges:

```json
{ "type": "auth_ok", "org_id": "org_01J8X4K9M3QVPN2T" }
```

### Events (Server → Client)

| Event Type | Trigger |
|---|---|
| `alert.new` | New alert confirmed for this org |
| `alert.updated` | Alert status or AI summary updated |
| `collection.pulse` | Heartbeat showing active collection stats (every 60s) |
| `system.notice` | Maintenance window or platform announcements |

**Example push event:**
```json
{
  "type": "alert.new",
  "timestamp": "2026-06-15T14:24:02Z",
  "data": {
    "alert_id": "alert_01J8X4KC123",
    "severity": "critical",
    "title": "47 employee credentials found in RedLine stealer log",
    "category": "credential_breach",
    "risk_score": 91
  }
}
```

### Client → Server Messages

| Message | Purpose |
|---|---|
| `ping` | Keep-alive (server replies `pong`) |
| `subscribe` | Subscribe to a specific alert category or watchlist item |
| `unsubscribe` | Remove subscription |

---

## 14. SDK Quick Reference

### Python SDK

```bash
pip install umbra-sdk
```

```python
from umbra import UmbraClient

client = UmbraClient(api_key="umbra_live_sk_...")

# List recent critical alerts
alerts = client.alerts.list(severity="critical", limit=10)
for alert in alerts:
    print(f"[{alert.severity.upper()}] {alert.title} — Score: {alert.risk_score}")

# Add a domain to watchlist
entry = client.watchlist.add(type="domain", value="acme.com")
print(f"Verification DNS record: {entry.verification.record_name}")

# Credential search
results = client.search.credentials(type="email_domain", value="acme.com")
print(f"Total breach records found: {results.total_breaches_found}")
```

### Node.js SDK

```bash
npm install @umbra-io/sdk
```

```typescript
import { UmbraClient } from '@umbra-io/sdk';

const client = new UmbraClient({ apiKey: 'umbra_live_sk_...' });

// List alerts
const alerts = await client.alerts.list({ severity: 'critical' });

// Get alert with AI summary
const alert = await client.alerts.get('alert_01J8X4KC123');
console.log(alert.ai_summary.text);

// Update alert status
await client.alerts.updateStatus('alert_01J8X4KC123', {
  status: 'resolved',
  resolution_note: 'Password resets completed for all affected accounts.'
});
```

---

## 15. Versioning & Deprecation

### Version Strategy

UMBRA uses **URL path versioning**: `/api/v1/`, `/api/v2/`

- **Additive changes** (new endpoints, new optional fields) are non-breaking and do not require a version bump.
- **Breaking changes** (removed/renamed fields, changed response structure, changed auth model) trigger a new major version.
- Each version is supported for a **minimum of 18 months** after a successor is released.

### Deprecation Notices

Deprecated endpoints include response headers:

```http
Deprecation: true
Sunset: Sat, 15 Jun 2027 00:00:00 GMT
Link: <https://docs.umbra.io/api/migration/v1-to-v2>; rel="deprecation"
```

### Changelog

| Version | Date | Notes |
|---|---|---|
| `v1.0.0` | June 2026 | Initial API release |
| `v1.1.0` | Q3 2026 (planned) | STIX export, Threat Actor endpoints, MSSP multi-org headers |
| `v2.0.0` | Q1 2027 (planned) | GraphQL alongside REST; breaking: pagination model change |

---

## 16. OpenAPI Specification Snippet

The full OpenAPI 3.0 specification is published at:

- **Live spec:** `https://api.umbra.io/v1/openapi.json`
- **Swagger UI:** `https://docs.umbra.io/api/playground`
- **Postman Collection:** Importable from `https://docs.umbra.io/api/postman`

**Partial spec excerpt for `GET /v1/alerts`:**

```yaml
openapi: "3.0.3"
info:
  title: UMBRA API
  version: "1.0.0"
  description: Advanced Computational System for Multi-Layered Dark Web Analysis

servers:
  - url: https://api.umbra.io/v1
    description: Production
  - url: https://api.staging.umbra.io/v1
    description: Staging

security:
  - BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      description: "UMBRA API Key: umbra_live_sk_..."

paths:
  /alerts:
    get:
      summary: List alerts
      operationId: listAlerts
      tags: [Alerts]
      parameters:
        - name: severity
          in: query
          schema:
            type: string
            enum: [critical, high, medium, low]
        - name: status
          in: query
          schema:
            type: string
            enum: [new, in_progress, resolved, false_positive]
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 500
            default: 50
        - name: cursor
          in: query
          schema:
            type: string
      responses:
        "200":
          description: Paginated list of alerts
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AlertListResponse"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "429":
          $ref: "#/components/responses/RateLimitExceeded"
```

---

*Document maintained by: Hardik Bhaskar | UMBRA Intelligence | API Reference v1.0.0*

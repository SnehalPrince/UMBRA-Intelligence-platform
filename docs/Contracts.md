# UMBRA — Contracts

> Interface Contracts, Service Agreements, and Data Exchange Specifications

**Version:** 1.0.0  
**Author:** Hardik Bhaskar  
**Status:** Draft → Review  
**Last Updated:** June 2026

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Internal Service Contracts (gRPC)](#2-internal-service-contracts-grpc)
3. [Kafka Event Schema Contracts (Avro)](#3-kafka-event-schema-contracts-avro)
4. [External API Contracts (REST)](#4-external-api-contracts-rest)
5. [Webhook Delivery Contract](#5-webhook-delivery-contract)
6. [Notification Channel Contracts](#6-notification-channel-contracts)
7. [Third-Party Integration Contracts](#7-third-party-integration-contracts)
8. [STIX/TAXII Output Contract](#8-stixtaxii-output-contract)
9. [SDK Contract (Python & Node.js)](#9-sdk-contract-python--nodejs)
10. [Service Level Agreements (SLAs)](#10-service-level-agreements-slas)
11. [Breaking Change Policy](#11-breaking-change-policy)
12. [Contract Testing Strategy](#12-contract-testing-strategy)

---

## 1. Purpose & Scope

This document defines all **interface contracts** between internal UMBRA services, between UMBRA and its customers, and between UMBRA and third-party integrations.

A **contract** in this context is a binding specification that:
- Defines exactly what data a producer sends and a consumer receives
- Specifies schema versions, field types, and required/optional fields
- Declares backward/forward compatibility guarantees
- Establishes failure behaviors and degradation expectations

**Design principle:** *Postel's Law* — be conservative in what you send, liberal in what you accept. All contracts include explicit deprecation windows before breaking changes.

---

## 2. Internal Service Contracts (gRPC)

Internal service-to-service sync communication uses **gRPC with mTLS** (`Architecture.md` §3). Proto files are the source of truth — generated stubs are committed alongside code.

Proto file location: `shared/proto/`

### 2.1 Alert Engine ↔ Notification Service

```protobuf
// shared/proto/notification/v1/notification.proto

syntax = "proto3";
package umbra.notification.v1;

import "google/protobuf/timestamp.proto";

service NotificationService {
  // Dispatch a confirmed alert to all configured channels for an org
  rpc DispatchAlert(DispatchAlertRequest) returns (DispatchAlertResponse);

  // Dispatch a test notification to verify a specific integration
  rpc TestIntegration(TestIntegrationRequest) returns (TestIntegrationResponse);

  // Re-dispatch a previously failed alert delivery
  rpc RedispatchAlert(RedispatchAlertRequest) returns (DispatchAlertResponse);
}

message DispatchAlertRequest {
  string alert_id    = 1;
  string org_id      = 2;
  AlertSeverity severity = 3;
  string title       = 4;
  string category    = 5;
  int32  risk_score  = 6;
  google.protobuf.Timestamp detected_at = 7;
  repeated string channels = 8;  // ["slack", "email", "webhook"] — empty = all configured
  optional string dispatch_note = 9;
}

message DispatchAlertResponse {
  string request_id = 1;
  repeated DeliveryResult results = 2;
}

message DeliveryResult {
  string integration_id = 1;
  string channel_type   = 2;
  bool   success        = 3;
  optional string error_message = 4;
  int64  latency_ms     = 5;
  google.protobuf.Timestamp delivered_at = 6;
}

enum AlertSeverity {
  ALERT_SEVERITY_UNSPECIFIED = 0;
  ALERT_SEVERITY_LOW         = 1;
  ALERT_SEVERITY_MEDIUM      = 2;
  ALERT_SEVERITY_HIGH        = 3;
  ALERT_SEVERITY_CRITICAL    = 4;
}

message TestIntegrationRequest {
  string org_id         = 1;
  string integration_id = 2;
}

message TestIntegrationResponse {
  bool   success       = 1;
  int64  latency_ms    = 2;
  optional string error = 3;
}

message RedispatchAlertRequest {
  string alert_id    = 1;
  string org_id      = 2;
  repeated string channels = 3;
}
```

---

### 2.2 API Gateway ↔ Dashboard BFF

```protobuf
// shared/proto/bff/v1/dashboard.proto

syntax = "proto3";
package umbra.bff.v1;

service DashboardService {
  // Get enriched alert feed with org context pre-loaded
  rpc GetAlertFeed(GetAlertFeedRequest) returns (GetAlertFeedResponse);

  // Get aggregated stats for the dashboard overview cards
  rpc GetDashboardStats(GetDashboardStatsRequest) returns (GetDashboardStatsResponse);

  // Subscribe to real-time alert stream for WebSocket fan-out
  rpc SubscribeAlerts(SubscribeAlertsRequest) returns (stream AlertEvent);
}

message GetAlertFeedRequest {
  string org_id    = 1;
  string cursor    = 2;
  int32  limit     = 3;
  repeated string severity_filter  = 4;
  repeated string category_filter  = 5;
  optional string status_filter    = 6;
  optional int64  since_unix_ms    = 7;
}

message GetAlertFeedResponse {
  repeated AlertSummary alerts = 1;
  string next_cursor           = 2;
  bool   has_more              = 3;
  int32  total_count           = 4;
}

message AlertSummary {
  string alert_id    = 1;
  string severity    = 2;
  string category    = 3;
  string status      = 4;
  string title       = 5;
  int32  risk_score  = 6;
  int64  detected_at = 7;
  bool   has_ai_summary = 8;
  int32  credential_count = 9;
}

message GetDashboardStatsRequest {
  string org_id  = 1;
  string period  = 2;  // "7d", "30d", "90d"
}

message GetDashboardStatsResponse {
  int32  total_alerts        = 1;
  int32  critical_alerts     = 2;
  int32  unresolved_alerts   = 3;
  int32  sources_monitored   = 4;
  float  false_positive_rate = 5;
  float  avg_resolve_time_h  = 6;
  int32  credentials_exposed = 7;
}

message SubscribeAlertsRequest {
  string org_id      = 1;
  string session_id  = 2;
}

message AlertEvent {
  string event_type  = 1;  // "alert.new", "alert.updated"
  string alert_id    = 2;
  string severity    = 3;
  string title       = 4;
  int64  timestamp   = 5;
}
```

---

### 2.3 Matcher Service ↔ Alert Engine

```protobuf
// shared/proto/matcher/v1/matcher.proto

syntax = "proto3";
package umbra.matcher.v1;

service MatcherService {
  // Check if a processed event matches any active watchlist item
  rpc MatchEvent(MatchEventRequest) returns (MatchEventResponse);

  // Refresh in-memory watchlist index for a specific org (triggered on watchlist change)
  rpc RefreshOrgWatchlist(RefreshOrgWatchlistRequest) returns (RefreshOrgWatchlistResponse);
}

message MatchEventRequest {
  string event_id      = 1;
  repeated string email_domains = 2;
  repeated string email_hashes  = 3;
  repeated string keywords      = 4;
  repeated string ip_addresses  = 5;
}

message MatchEventResponse {
  bool   has_matches   = 1;
  repeated MatchResult matches = 2;
}

message MatchResult {
  string org_id            = 1;
  string watchlist_item_id = 2;
  string match_type        = 3;  // "exact_domain", "keyword", "email_hash", "ip_range"
  string matched_value     = 4;
  float  match_confidence  = 5;
}

message RefreshOrgWatchlistRequest {
  string org_id = 1;
}

message RefreshOrgWatchlistResponse {
  bool   success     = 1;
  int32  item_count  = 2;
}
```

---

### 2.4 Identity Service ↔ API Gateway

```protobuf
// shared/proto/identity/v1/identity.proto

syntax = "proto3";
package umbra.identity.v1;

service IdentityService {
  // Validate an API key and return the associated org context
  rpc ValidateApiKey(ValidateApiKeyRequest) returns (ValidateApiKeyResponse);

  // Validate a JWT and return the user context
  rpc ValidateJWT(ValidateJWTRequest) returns (ValidateJWTResponse);

  // Check if an actor has a specific permission
  rpc CheckPermission(CheckPermissionRequest) returns (CheckPermissionResponse);
}

message ValidateApiKeyRequest {
  string raw_key = 1;  // Full API key from Authorization header
}

message ValidateApiKeyResponse {
  bool   valid       = 1;
  string key_id      = 2;
  string org_id      = 3;
  string scope       = 4;  // "api:read", "api:write", "api:admin"
  optional string error = 5;
}

message ValidateJWTRequest {
  string token = 1;
}

message ValidateJWTResponse {
  bool   valid    = 1;
  string user_id  = 2;
  string org_id   = 3;
  string role     = 4;
  int64  exp      = 5;
}

message CheckPermissionRequest {
  string actor_id    = 1;
  string org_id      = 2;
  string resource    = 3;  // "alerts", "watchlist", "users", "api_keys"
  string action      = 4;  // "read", "write", "delete", "admin"
}

message CheckPermissionResponse {
  bool allowed = 1;
  optional string reason = 2;
}
```

---

## 3. Kafka Event Schema Contracts (Avro)

All Kafka messages use **Avro** schemas registered in the Confluent Schema Registry. Schemas are versioned; producers and consumers must be compatible with the registered schema version.

Schema registry URL: `http://schema-registry:8081`

### Compatibility Mode: `BACKWARD`

All schema evolutions must be backward compatible:
- ✅ Add new optional field with default value
- ✅ Remove field with default value
- ❌ Remove required field (no default)
- ❌ Change field type
- ❌ Rename field without alias

---

### 3.1 `raw_event_v1` — Topic: `raw.events`

```json
{
  "type": "record",
  "name": "RawEvent",
  "namespace": "io.umbra.events.v1",
  "doc": "Event emitted by a collector immediately after data capture.",
  "fields": [
    { "name": "event_id",          "type": "string",  "doc": "ULID-format unique event ID" },
    { "name": "source_type",       "type": "string",  "doc": "telegram_channel | tor_site | paste_site | github | i2p | feed" },
    { "name": "source_id",         "type": "string",  "doc": "Internal source identifier" },
    { "name": "source_tier",       "type": "int",     "doc": "Source trust tier: 1 (highest) to 3" },
    { "name": "collected_at",      "type": "long",    "logicalType": "timestamp-millis" },
    { "name": "content_type",      "type": "string",  "doc": "credential_dump | forum_post | paste | ransomware_listing | iab_listing" },
    { "name": "raw_content_s3_key","type": "string",  "doc": "S3 key for raw content archive" },
    { "name": "raw_content_hash",  "type": "string",  "doc": "SHA-256 of raw content" },
    { "name": "content_size_bytes","type": "long" },
    { "name": "metadata",          "type": { "type": "map", "values": "string" }, "default": {} },
    { "name": "collector_version", "type": "string" },
    { "name": "collection_region", "type": "string",  "default": "us-east-1" }
  ]
}
```

---

### 3.2 `processed_event_v1` — Topic: `processed.events`

```json
{
  "type": "record",
  "name": "ProcessedEvent",
  "namespace": "io.umbra.events.v1",
  "doc": "Normalized, enriched event after the processor stage.",
  "fields": [
    { "name": "event_id",          "type": "string" },
    { "name": "raw_event_id",      "type": "string",  "doc": "Back-reference to raw_event_v1" },
    { "name": "raw_event_hash",    "type": "string" },
    { "name": "source_type",       "type": "string" },
    { "name": "source_id",         "type": "string" },
    { "name": "source_tier",       "type": "int" },
    { "name": "content_type",      "type": "string" },
    { "name": "email_domains",     "type": { "type": "array", "items": "string" }, "default": [] },
    { "name": "email_hashes",      "type": { "type": "array", "items": "string" }, "default": [] },
    { "name": "malware_family",    "type": ["null", "string"], "default": null },
    { "name": "credential_count",  "type": ["null", "int"],    "default": null },
    { "name": "keyword_mentions",  "type": { "type": "array", "items": "string" }, "default": [] },
    { "name": "ip_addresses",      "type": { "type": "array", "items": "string" }, "default": [] },
    { "name": "language",          "type": ["null", "string"], "default": null },
    { "name": "risk_score",        "type": "int",    "doc": "0-100 from XGBoost risk model" },
    { "name": "ai_classification", "type": "string", "doc": "Output of FastText+BERT classifier" },
    { "name": "is_duplicate",      "type": "boolean" },
    { "name": "duplicate_of",      "type": ["null", "string"], "default": null },
    { "name": "mitre_techniques",  "type": { "type": "array", "items": "string" }, "default": [] },
    { "name": "harvest_date_est",  "type": ["null", "int"],    "default": null, "logicalType": "date" },
    { "name": "collected_at",      "type": "long",   "logicalType": "timestamp-millis" },
    { "name": "processed_at",      "type": "long",   "logicalType": "timestamp-millis" },
    { "name": "processor_version", "type": "string" }
  ]
}
```

---

### 3.3 `confirmed_alert_v1` — Topic: `alerts.confirmed`

```json
{
  "type": "record",
  "name": "ConfirmedAlert",
  "namespace": "io.umbra.alerts.v1",
  "doc": "Alert confirmed by the Alert Engine after watchlist matching and deduplication.",
  "fields": [
    { "name": "alert_id",          "type": "string" },
    { "name": "org_id",            "type": "string" },
    { "name": "severity",          "type": "string" },
    { "name": "category",          "type": "string" },
    { "name": "title",             "type": "string" },
    { "name": "risk_score",        "type": "int" },
    { "name": "source_type",       "type": "string" },
    { "name": "source_id",         "type": "string" },
    { "name": "source_tier",       "type": "int" },
    { "name": "matched_watchlist_items", "type": {
        "type": "array",
        "items": {
          "type": "record",
          "name": "WatchlistMatch",
          "fields": [
            { "name": "watchlist_item_id", "type": "string" },
            { "name": "match_type",        "type": "string" },
            { "name": "matched_value",     "type": "string" }
          ]
        }
      }, "default": []
    },
    { "name": "credential_count",  "type": ["null", "int"],    "default": null },
    { "name": "malware_family",    "type": ["null", "string"], "default": null },
    { "name": "raw_event_hash",    "type": "string" },
    { "name": "detected_at",       "type": "long",  "logicalType": "timestamp-millis" },
    { "name": "created_at",        "type": "long",  "logicalType": "timestamp-millis" }
  ]
}
```

---

## 4. External API Contracts (REST)

The REST API contract is defined by the OpenAPI 3.0 specification (`API.md` §16). This section defines the **stability guarantees** and **consumer expectations** beyond the schema.

### 4.1 Stability Guarantees

| Category | Guarantee |
|---|---|
| **Stable fields** | Will not be removed or renamed without a version bump and 18-month deprecation window |
| **Beta fields** | Prefixed with `_beta_`. May change without notice. Do not build production systems on them |
| **Additive changes** | New optional response fields and new endpoints are non-breaking and may appear anytime |
| **Error codes** | Application error codes (e.g. `WATCHLIST_LIMIT_EXCEEDED`) are stable; HTTP status codes map to fixed ranges |
| **Pagination** | Cursor-based pagination is stable for v1. Cursor tokens are opaque — do not parse internals |
| **IDs** | Resource ID format (ULID) is stable. IDs are sortable by creation time |

### 4.2 Consumer Obligations

Consumers of the UMBRA REST API MUST:

1. **Handle unknown fields gracefully** — Ignore any response fields not present in your known schema (additive changes may introduce them)
2. **Handle `503` with exponential backoff** — Retry with `base=1s, max=60s, jitter=true` on transient failures
3. **Validate HMAC signatures** on webhook payloads before processing (see §5)
4. **Respect `Retry-After` headers** on `429` responses — do not retry before the specified time
5. **Use `Idempotency-Key`** on all `POST` requests that create resources to safely retry on network errors

### 4.3 Versioning Contract

- URL path: `/v1/`, `/v2/`
- `Deprecation: true` + `Sunset: <date>` headers on deprecated endpoints
- **Minimum 18 months** support after new version released
- SDK major versions track API major versions

---

## 5. Webhook Delivery Contract

### 5.1 Delivery Specification

| Property | Value |
|---|---|
| Protocol | HTTPS (TLS 1.2+ required) |
| Method | `POST` |
| Content-Type | `application/json` |
| Timeout | 10 seconds |
| Retry on failure | 3 attempts: immediately, +30s, +5min |
| Retry on non-2xx | Yes (including 3xx, 4xx — treats as delivery failure) |
| Dead-letter | After 3 failures, stored in PostgreSQL `integrations.last_error_msg` |
| Order guarantee | Best-effort; alerts for same org may arrive slightly out-of-order |

### 5.2 Payload Envelope Contract

```json
{
  "event": "alert.new",
  "delivery_id": "del_01J8X4KI234",
  "timestamp": "2026-06-15T15:00:00Z",
  "api_version": "2026-06-01",
  "org_id": "org_01J8X4K9M3QVPN2T",
  "data": {
    /* Event-type-specific payload — see 5.3 */
  }
}
```

All envelope fields are **stable**. The `data` object shape varies by event type.

### 5.3 Event Type Payloads

#### `alert.new`

```json
{
  "data": {
    "alert": {
      "id": "alert_01J8X4KC123",
      "severity": "critical",
      "category": "credential_breach",
      "status": "new",
      "title": "47 employee credentials found in RedLine stealer log",
      "risk_score": 91,
      "detected_at": "2026-06-15T14:23:11Z",
      "source": {
        "type": "telegram_channel",
        "tier": 1
      },
      "credential_count": 47,
      "malware_family": "RedLine",
      "ai_summary_status": "ready",
      "alert_url": "https://app.umbra.io/alerts/alert_01J8X4KC123"
    }
  }
}
```

#### `alert.status_changed`

```json
{
  "data": {
    "alert_id": "alert_01J8X4KC123",
    "previous_status": "new",
    "new_status": "resolved",
    "changed_by": "usr_01J8X4KJ567",
    "changed_at": "2026-06-15T15:30:00Z",
    "resolution_note": "Password resets completed."
  }
}
```

#### `watchlist.item_verified`

```json
{
  "data": {
    "watchlist_item_id": "wl_01J8X4KBCD234",
    "type": "domain",
    "value": "acme.com",
    "verified_at": "2026-06-15T09:12:00Z"
  }
}
```

### 5.4 Signature Verification Contract

Every delivery includes:

```http
X-Umbra-Signature: sha256=<hex_hmac_sha256(secret, raw_body)>
X-Umbra-Timestamp: <unix_timestamp>
```

Consumers MUST:
1. Compute `HMAC-SHA256(webhook_secret, raw_request_body)`
2. Compare with constant-time equality to `X-Umbra-Signature` value (strip `sha256=` prefix)
3. Reject if `|now - X-Umbra-Timestamp| > 300 seconds` (replay protection)

---

## 6. Notification Channel Contracts

### 6.1 Slack Contract

UMBRA uses Slack's **Block Kit** message format. All Slack messages include:

- **Alert header** block with severity color coding (critical=red, high=orange, medium=yellow, low=blue)
- **Context block** with source, malware family, and credential count
- **Actions block** with "View in UMBRA" button linking to the full alert

```json
{
  "attachments": [{
    "color": "#DC2626",
    "blocks": [
      {
        "type": "header",
        "text": { "type": "plain_text", "text": "🚨 CRITICAL: Credential Breach Detected" }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*47 employee credentials* found in a RedLine stealer log\n*Domain:* acme.com | *Risk Score:* 91/100"
        }
      },
      {
        "type": "context",
        "elements": [
          { "type": "mrkdwn", "text": "🔴 *Source:* Telegram Channel (Tier 1)" },
          { "type": "mrkdwn", "text": "🦠 *Malware:* RedLine" },
          { "type": "mrkdwn", "text": "📅 *Detected:* June 15, 2026, 14:23 UTC" }
        ]
      },
      {
        "type": "actions",
        "elements": [{
          "type": "button",
          "text": { "type": "plain_text", "text": "View Full Alert →" },
          "url": "https://app.umbra.io/alerts/alert_01J8X4KC123",
          "style": "danger"
        }]
      }
    ]
  }]
}
```

### 6.2 Microsoft Teams Contract

UMBRA uses **Adaptive Cards** via Office 365 Connector webhooks.

### 6.3 Email Contract

| Field | Value |
|---|---|
| From | `alerts@umbra.io` (SES-verified domain) |
| Reply-To | `support@umbra.io` |
| Subject template | `[UMBRA] {severity}: {title} — {org_name}` |
| Format | HTML (responsive) + plain text fallback |
| Unsubscribe | `List-Unsubscribe` header; per-channel mute in dashboard |
| SPF/DKIM/DMARC | All enforced; `p=reject` DMARC policy |

---

## 7. Third-Party Integration Contracts

### 7.1 Stripe Billing Contract

| UMBRA Event | Stripe Action |
|---|---|
| Org creates paid subscription | Create Stripe Customer + Subscription |
| Plan upgrade | Update Stripe Subscription (`proration_behavior: always_invoice`) |
| API usage over plan limit | Report meter event via Stripe Billing Meter |
| Payment failure | `invoice.payment_failed` webhook → Set org `plan` to grace period (7 days) |
| Subscription canceled | `customer.subscription.deleted` → `org.monitoring_active = false` after grace |
| Org deleted (GDPR) | Stripe Customer archived (not deleted — for payment records) |

**Webhook events consumed from Stripe:**

```
invoice.payment_succeeded
invoice.payment_failed
customer.subscription.deleted
customer.subscription.updated
checkout.session.completed
```

All Stripe webhook payloads are validated using `stripe-signature` header via Stripe's official SDK.

---

### 7.2 Anthropic Claude API Contract

UMBRA uses Claude for LLM enrichment (`TechStack.md` §4). The contract defines expected input/output to make the integration swappable.

**Interface contract (abstract):**

```python
class LLMEnrichmentProvider(Protocol):
    async def enrich_alert(
        self,
        finding: dict,
        org_context: dict
    ) -> LLMEnrichmentResult:
        ...

@dataclass
class LLMEnrichmentResult:
    summary: str              # 2-sentence plain-English summary
    severity: str             # critical | high | medium | low
    severity_reasoning: str   # Why this severity
    remediation_steps: list[str]  # 3 ordered steps
    mitre_techniques: list[str]   # ["T1078.002", ...]
    model_used: str
    latency_ms: int
    tokens_used: int
    cache_hit: bool
```

**Failure contract:**
- If Claude API returns error or times out (> 8s): alert is delivered with `ai_summary_status: "pending"`, retry is scheduled for 5 minutes later
- If 3 retries fail: `ai_summary_status: "failed"`, alert is marked with raw data only — **alert is never blocked by LLM failure** (FR-062)

---

### 7.3 HaveIBeenPwned API Contract

```
GET https://haveibeenpwned.com/api/v3/breachedaccount/{email}

Headers:
  hibp-api-key: {api_key}
  User-Agent: UMBRA-Intelligence/1.0 (contact@umbra.io)

Rate limit: 1 req/1500ms per key
Retry on 429: exponential backoff starting at 2s
```

Data from HIBP is tagged with `source: "hibp"` and normalized into `breach_events` Elasticsearch index.

---

## 8. STIX/TAXII Output Contract

UMBRA supports **STIX 2.1** output for threat intelligence sharing (`Requirements.md` §5, FR-081).

### 8.1 STIX Object Mappings

| UMBRA Object | STIX Object Type |
|---|---|
| `alert` (credential_breach) | `observed-data` + `indicator` |
| `threat_actor` | `threat-actor` |
| `malware_family` (e.g. RedLine) | `malware` |
| `ioc` (IP/domain/hash) | `indicator` |
| `alert` → `threat_actor` | `relationship` (attributed-to) |
| Campaign | `campaign` |

### 8.2 Example STIX Bundle

```json
{
  "type": "bundle",
  "id": "bundle--f9a3c1d2-1234-5678-abcd-ef0123456789",
  "spec_version": "2.1",
  "objects": [
    {
      "type": "indicator",
      "spec_version": "2.1",
      "id": "indicator--a1b2c3d4-5678-90ab-cdef-012345678901",
      "created": "2026-06-15T14:24:00Z",
      "modified": "2026-06-15T14:24:00Z",
      "name": "Credential breach: acme.com in RedLine stealer log",
      "description": "47 credentials associated with acme.com domain detected in a Tier-1 Telegram stealer log, malware family: RedLine",
      "indicator_types": ["compromised"],
      "pattern": "[email-message:from_ref.value MATCHES '.*@acme\\.com']",
      "pattern_type": "stix",
      "valid_from": "2026-06-14T00:00:00Z",
      "labels": ["malicious-activity"],
      "external_references": [
        {
          "source_name": "umbra",
          "external_id": "alert_01J8X4KC123",
          "url": "https://app.umbra.io/alerts/alert_01J8X4KC123"
        }
      ],
      "extensions": {
        "extension-definition--umbra-alert-v1": {
          "severity": "critical",
          "risk_score": 91,
          "malware_family": "RedLine",
          "credential_count": 47,
          "mitre_techniques": ["T1078.002", "T1555.003"]
        }
      }
    }
  ]
}
```

### 8.3 TAXII 2.1 Endpoint Contract

```
Discovery:    GET  https://api.umbra.io/taxii/
API Root:     GET  https://api.umbra.io/taxii/api/
Collections:  GET  https://api.umbra.io/taxii/api/collections/
Objects:      GET  https://api.umbra.io/taxii/api/collections/{id}/objects/

Authentication: Bearer token (same UMBRA API key)
Content-Type: application/taxii+json;version=2.1
```

---

## 9. SDK Contract (Python & Node.js)

The SDKs are thin wrappers that must conform to these contracts regardless of the underlying HTTP changes.

### 9.1 Python SDK Interface Contract

```python
class UmbraClient:
    def __init__(self, api_key: str, base_url: str = "https://api.umbra.io/v1", timeout: int = 30): ...

    # Namespaced sub-clients
    @property
    def alerts(self) -> AlertsClient: ...
    
    @property
    def watchlist(self) -> WatchlistClient: ...
    
    @property
    def search(self) -> SearchClient: ...
    
    @property
    def reports(self) -> ReportsClient: ...
    
    @property
    def threat_actors(self) -> ThreatActorsClient: ...

class AlertsClient:
    def list(self, *, severity: str | None = None, status: str | None = None,
             category: str | None = None, since: datetime | None = None,
             limit: int = 50, cursor: str | None = None) -> PagedResult[Alert]: ...
    
    def get(self, alert_id: str) -> Alert: ...
    
    def update_status(self, alert_id: str, status: str, resolution_note: str | None = None) -> Alert: ...
    
    def dispatch(self, alert_id: str, channels: list[str] | None = None) -> list[DeliveryResult]: ...
    
    def stats(self, period: str = "30d") -> AlertStats: ...

class WatchlistClient:
    def list(self, *, type: str | None = None, status: str | None = None) -> PagedResult[WatchlistItem]: ...
    
    def add(self, type: str, value: str, label: str | None = None) -> WatchlistItem: ...
    
    def remove(self, item_id: str) -> None: ...
    
    def verify(self, item_id: str) -> WatchlistItem: ...

class SearchClient:
    def credentials(self, type: str, value: str, include_historical: bool = False) -> CredentialSearchResult: ...
    
    def paste(self, query: str, query_type: str = "keyword") -> PasteSearchResult: ...
    
    def dark_forum(self, query: str) -> ForumSearchResult: ...
```

**Exception hierarchy:**

```python
UmbraError
├── UmbraAuthError         # 401 / 403
├── UmbraNotFoundError     # 404
├── UmbraValidationError   # 422 — includes .field and .code
├── UmbraRateLimitError    # 429 — includes .retry_after_seconds
└── UmbraServerError       # 500 / 503
```

### 9.2 Node.js SDK Interface Contract

```typescript
interface UmbraClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

class UmbraClient {
  constructor(options: UmbraClientOptions);
  
  readonly alerts: AlertsClient;
  readonly watchlist: WatchlistClient;
  readonly search: SearchClient;
  readonly reports: ReportsClient;
  readonly threatActors: ThreatActorsClient;
}

interface AlertsClient {
  list(params?: AlertListParams): Promise<PagedResult<Alert>>;
  get(alertId: string): Promise<Alert>;
  updateStatus(alertId: string, params: UpdateStatusParams): Promise<Alert>;
  dispatch(alertId: string, params?: DispatchParams): Promise<DeliveryResult[]>;
  stats(period?: '7d' | '30d' | '90d' | '1y'): Promise<AlertStats>;
}

// All methods throw UmbraError subclasses on failure
class UmbraError extends Error {
  code: string;
  statusCode: number;
  requestId: string;
}
```

---

## 10. Service Level Agreements (SLAs)

### 10.1 Platform SLA

| Metric | Commitment | Remedy |
|---|---|---|
| **API Availability** | 99.9% monthly | 10% credit per 0.1% below SLA |
| **Alert Delivery (P50)** | < 45 minutes | 5% credit per missed SLO for month |
| **Alert Delivery (P95)** | < 60 minutes | As above |
| **API Latency (P95)** | < 300ms | Reported; credit on sustained breach |
| **Scheduled maintenance** | < 4 hours/month | Announced 72 hours in advance |
| **Emergency maintenance** | < 1 hour | Communicated on status.umbra.io |

### 10.2 Support SLA (by Plan)

| Plan | First Response | Critical Issues | Availability |
|---|---|---|---|
| Scout | 72 hours | N/A | Email only |
| Operator | 24 hours | 8 hours | Email |
| Sentinel | 8 hours | 4 hours | Email + Slack channel |
| Guardian | 4 hours | 2 hours | Email + Slack + PagerDuty |
| Enterprise | 1 hour | 30 minutes | 24/7 dedicated CSM |

### 10.3 Data Availability SLA

| Data Type | Point-in-Time Recovery | RTO | RPO |
|---|---|---|---|
| Alert records (PostgreSQL) | Continuous WAL | 30 min | 15 min |
| Breach events (Elasticsearch) | 6-hour snapshot | 2 hours | 6 hours |
| Audit logs | S3 WORM | 4 hours | 0 (immutable) |

---

## 11. Breaking Change Policy

### Definition of Breaking Change

A breaking change is any modification that requires **consumers to update their code or configuration** to avoid failures.

**Breaking:**
- Removing a required request field
- Removing or renaming a response field that is documented as stable
- Changing a field's data type
- Changing authentication requirements
- Changing pagination format or cursor token structure
- Changing webhook HMAC algorithm

**Non-breaking (may happen at any time):**
- Adding new optional request fields
- Adding new response fields
- Adding new endpoints
- Adding new enum values to extensible enums
- Performance improvements (latency reduction)
- New `_beta_` fields

### Breaking Change Process

1. **Announce:** Post in changelog, email all Enterprise + Guardian API users, add `Deprecation` + `Sunset` response headers
2. **Migration guide:** Publish at `https://docs.umbra.io/api/migration/`
3. **18-month window:** Old behavior supported for minimum 18 months after new version available
4. **Sunset:** Hard removal only after `Sunset` date has passed

---

## 12. Contract Testing Strategy

### Consumer-Driven Contract Testing

UMBRA uses **Pact** for contract testing between internal services:

```
Consumer (e.g., notification service) defines expected request/response
    │
    ▼
Pact file generated: notification-service → alert-engine.json
    │
    ▼
Provider (alert-engine) verifies it can satisfy the pact
    │
    ▼
CI/CD fails if provider breaks any consumer contract
```

### External API Contract Tests

The OpenAPI spec is used to generate automated conformance tests via **Schemathesis**:

```bash
# Run API contract conformance tests against staging
schemathesis run https://api.staging.umbra.io/v1/openapi.json \
  --auth "Bearer umbra_test_sk_..." \
  --checks all \
  --max-examples 100
```

### Kafka Schema Tests

Schema compatibility is enforced at CI time:

```bash
# Verify schema is backward-compatible before merge
curl -X POST http://schema-registry:8081/compatibility/subjects/processed.events-value/versions/latest \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d @shared/proto/events/processed_event_v2.avsc
```

**Expected:** `{"is_compatible": true}` — CI fails if `false`.

---

*Document maintained by: Hardik Bhaskar | UMBRA Intelligence | Contracts v1.0.0*

# UMBRA — Database Design

> Schema Reference | PostgreSQL 16 + Elasticsearch 8.x + ClickHouse + Redis

**Version:** 1.0.0  
**Author:** Hardik Bhaskar  
**Status:** Draft → Review  
**Last Updated:** June 2026

---

## Table of Contents

1. [Database Architecture Overview](#1-database-architecture-overview)
2. [PostgreSQL — Relational Schema](#2-postgresql--relational-schema)
3. [Elasticsearch — Search & Event Indices](#3-elasticsearch--search--event-indices)
4. [ClickHouse — Time-Series Analytics](#4-clickhouse--time-series-analytics)
5. [Redis — Cache & Pub/Sub](#5-redis--cache--pubsub)
6. [AWS S3 — Object Storage Layout](#6-aws-s3--object-storage-layout)
7. [Apache Kafka — Topic Design](#7-apache-kafka--topic-design)
8. [Data Flows Between Stores](#8-data-flows-between-stores)
9. [Indexing Strategy](#9-indexing-strategy)
10. [Data Retention & Archival](#10-data-retention--archival)
11. [Migration Strategy](#11-migration-strategy)
12. [Privacy & Credential Handling](#12-privacy--credential-handling)

---

## 1. Database Architecture Overview

Each database in UMBRA's storage layer plays a distinct, non-overlapping role (`Architecture.md` §7):

| Store | Engine | Role | Why |
|---|---|---|---|
| **PostgreSQL 16** | RDBMS | Source of truth for all transactional data | ACID, FK integrity, complex joins for billing + RBAC |
| **Elasticsearch 8.x** | Inverted index | Full-text search across breach events, forum posts | Sub-100ms full-text + keyword search at billions of records |
| **ClickHouse** | Columnar OLAP | Trend analytics, time-series charts, executive dashboards | Blazing-fast aggregations over 100M+ events |
| **Redis 7** | In-memory KV | Sessions, rate limits, WebSocket fan-out, hot-path cache | Sub-millisecond read/write; ephemeral data |
| **AWS S3** | Object store | Raw archives, generated PDFs, WORM audit logs | Durable, cheap cold storage; lifecycle-managed |
| **Apache Kafka** | Distributed log | Event streaming backbone between microservices | Decoupled, replayable, high-throughput pipeline |

---

## 2. PostgreSQL — Relational Schema

PostgreSQL is the **system of record** for: organizations, users, watchlists, alerts, billing, integrations, API keys, and audit logs.

### 2.1 Schema: `public` (Default)

#### Table: `organizations`

```sql
CREATE TABLE organizations (
  id               TEXT        PRIMARY KEY,          -- ULID: org_01J8X4K9M3QVPN2T
  name             TEXT        NOT NULL,
  slug             TEXT        UNIQUE NOT NULL,      -- URL-safe short name: "acme-corp"
  plan             TEXT        NOT NULL DEFAULT 'scout'
                               CHECK (plan IN ('scout','operator','sentinel','guardian','enterprise')),
  industry         TEXT,                             -- Enum: financial_services, healthcare, etc.
  primary_domain   TEXT        NOT NULL,
  billing_email    TEXT        NOT NULL,
  notification_email TEXT,
  stripe_customer_id TEXT      UNIQUE,
  monitoring_active BOOLEAN    NOT NULL DEFAULT TRUE,
  data_region      TEXT        NOT NULL DEFAULT 'us-east-1'
                               CHECK (data_region IN ('us-east-1','eu-west-1','ap-southeast-1')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ                       -- Soft delete for offboarding
);

CREATE INDEX idx_organizations_primary_domain ON organizations(primary_domain);
CREATE INDEX idx_organizations_plan ON organizations(plan);
```

---

#### Table: `users`

```sql
CREATE TABLE users (
  id               TEXT        PRIMARY KEY,          -- ULID: usr_01J8X4KJ567
  org_id           TEXT        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email            TEXT        UNIQUE NOT NULL,
  name             TEXT        NOT NULL,
  role             TEXT        NOT NULL
                               CHECK (role IN ('org:owner','org:admin','org:analyst','org:viewer')),
  password_hash    TEXT,                             -- NULL for SSO-only users
  mfa_enabled      BOOLEAN     NOT NULL DEFAULT FALSE,
  mfa_totp_secret  TEXT,                             -- Encrypted via Vault transit
  email_verified   BOOLEAN     NOT NULL DEFAULT FALSE,
  last_login_at    TIMESTAMPTZ,
  last_login_ip    INET,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
```

---

#### Table: `watchlist_items`

```sql
CREATE TABLE watchlist_items (
  id               TEXT        PRIMARY KEY,          -- ULID: wl_01J8X4KBCD234
  org_id           TEXT        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type             TEXT        NOT NULL
                               CHECK (type IN ('domain','email_domain','ip_range','keyword','email_address','executive_name')),
  value            TEXT        NOT NULL,
  value_normalized TEXT        NOT NULL,             -- Lowercased, trimmed for dedup
  label            TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending_verification'
                               CHECK (status IN ('active','pending_verification','disabled','expired')),
  verification_method TEXT     CHECK (verification_method IN ('dns_txt','email_code','manual')),
  verification_token  TEXT,
  verified_at      TIMESTAMPTZ,
  monitoring_since TIMESTAMPTZ,
  alert_count      INTEGER     NOT NULL DEFAULT 0,
  last_alert_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, type, value_normalized)
);

CREATE INDEX idx_watchlist_org_id ON watchlist_items(org_id);
CREATE INDEX idx_watchlist_type_value ON watchlist_items(type, value_normalized);
CREATE INDEX idx_watchlist_status ON watchlist_items(status) WHERE status = 'active';
```

---

#### Table: `alerts`

```sql
CREATE TABLE alerts (
  id               TEXT        PRIMARY KEY,          -- ULID: alert_01J8X4KC123
  org_id           TEXT        NOT NULL REFERENCES organizations(id),
  severity         TEXT        NOT NULL
                               CHECK (severity IN ('critical','high','medium','low')),
  category         TEXT        NOT NULL
                               CHECK (category IN (
                                 'credential_breach','forum_mention','ransomware_listing',
                                 'paste_exposure','iab_listing','code_secret','brand_mention'
                               )),
  status           TEXT        NOT NULL DEFAULT 'new'
                               CHECK (status IN ('new','in_progress','resolved','false_positive')),
  title            TEXT        NOT NULL,
  risk_score       SMALLINT    NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  -- Source metadata
  source_type      TEXT        NOT NULL,
  source_id        TEXT,
  source_name      TEXT,
  source_tier      SMALLINT    CHECK (source_tier IN (1,2,3)),
  -- Finding metadata
  credential_count INTEGER,
  malware_family   TEXT,
  harvest_date_est DATE,
  raw_event_hash   TEXT,                             -- SHA-256 of originating raw event (audit lineage)
  breach_event_id  TEXT,                             -- Reference to Elasticsearch breach_events index
  -- AI enrichment
  ai_summary_status TEXT       NOT NULL DEFAULT 'pending'
                               CHECK (ai_summary_status IN ('pending','ready','failed')),
  ai_summary_text  TEXT,
  ai_remediation   JSONB,                            -- Array of remediation steps
  ai_mitre_techniques TEXT[],                        -- e.g. {'T1078.002','T1555.003'}
  ai_severity_reasoning TEXT,
  -- Triage
  resolved_at      TIMESTAMPTZ,
  resolved_by      TEXT        REFERENCES users(id),
  resolution_note  TEXT,
  false_positive_at TIMESTAMPTZ,
  -- Timestamps
  detected_at      TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_org_id ON alerts(org_id);
CREATE INDEX idx_alerts_org_severity ON alerts(org_id, severity);
CREATE INDEX idx_alerts_org_status ON alerts(org_id, status);
CREATE INDEX idx_alerts_detected_at ON alerts(detected_at DESC);
CREATE INDEX idx_alerts_org_category ON alerts(org_id, category);
```

---

#### Table: `alert_watchlist_matches`

Junction table linking alerts to the specific watchlist items that triggered them.

```sql
CREATE TABLE alert_watchlist_matches (
  alert_id         TEXT        NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  watchlist_item_id TEXT       NOT NULL REFERENCES watchlist_items(id),
  match_type       TEXT        NOT NULL,             -- 'exact_domain', 'keyword', 'email_hash', 'ip_range'
  match_value      TEXT,                             -- Specific matched value (e.g. email hash)
  PRIMARY KEY (alert_id, watchlist_item_id)
);

CREATE INDEX idx_awm_watchlist_item ON alert_watchlist_matches(watchlist_item_id);
```

---

#### Table: `breach_credential_hashes`

Stores hashed credential fingerprints for deduplication and future lookups — **never raw credentials**.

```sql
CREATE TABLE breach_credential_hashes (
  id               TEXT        PRIMARY KEY,
  alert_id         TEXT        NOT NULL REFERENCES alerts(id),
  email_hash       TEXT        NOT NULL,             -- SHA-256(normalized_email)
  email_domain     TEXT        NOT NULL,             -- plaintext domain only
  password_hint    TEXT,                             -- e.g. "P***w0rd12*!" (4 chars revealed)
  password_hash    TEXT,                             -- SHA-256(password) for re-breach detection
  is_admin_account BOOLEAN     NOT NULL DEFAULT FALSE,
  is_service_account BOOLEAN   NOT NULL DEFAULT FALSE,
  source_type      TEXT        NOT NULL,
  malware_family   TEXT,
  harvest_date_est DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL              -- Per retention policy (3 years)
);

CREATE INDEX idx_bch_email_domain ON breach_credential_hashes(email_domain);
CREATE INDEX idx_bch_email_hash ON breach_credential_hashes(email_hash);
CREATE INDEX idx_bch_alert_id ON breach_credential_hashes(alert_id);
```

---

#### Table: `api_keys`

```sql
CREATE TABLE api_keys (
  id               TEXT        PRIMARY KEY,
  org_id           TEXT        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by       TEXT        REFERENCES users(id),
  name             TEXT        NOT NULL,
  key_hash         TEXT        UNIQUE NOT NULL,      -- SHA-256(raw_api_key) — raw key never stored
  key_prefix       TEXT        NOT NULL,             -- "umbra_live_sk_a1b2..." first 20 chars for display
  scope            TEXT        NOT NULL
                               CHECK (scope IN ('api:read','api:write','api:admin')),
  last_used_at     TIMESTAMPTZ,
  last_used_ip     INET,
  request_count    BIGINT      NOT NULL DEFAULT 0,
  expires_at       TIMESTAMPTZ,
  revoked_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_org_id ON api_keys(org_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
```

---

#### Table: `integrations`

```sql
CREATE TABLE integrations (
  id               TEXT        PRIMARY KEY,
  org_id           TEXT        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type             TEXT        NOT NULL
                               CHECK (type IN (
                                 'webhook','slack','microsoft_teams','pagerduty',
                                 'jira','servicenow','splunk_hec','elastic_siem',
                                 'ms_sentinel','okta','azure_ad','google_workspace'
                               )),
  name             TEXT        NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active','inactive','error')),
  config           JSONB       NOT NULL DEFAULT '{}', -- Encrypted at application layer via Vault
  severity_filter  TEXT[]      NOT NULL DEFAULT '{critical,high,medium,low}',
  event_types      TEXT[]      NOT NULL DEFAULT '{alert.new}',
  last_delivery_at TIMESTAMPTZ,
  last_error_at    TIMESTAMPTZ,
  last_error_msg   TEXT,
  delivery_count   BIGINT      NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integrations_org_id ON integrations(org_id);
```

---

#### Table: `billing_subscriptions`

```sql
CREATE TABLE billing_subscriptions (
  id               TEXT        PRIMARY KEY,
  org_id           TEXT        UNIQUE NOT NULL REFERENCES organizations(id),
  stripe_sub_id    TEXT        UNIQUE,
  plan             TEXT        NOT NULL,
  billing_cycle    TEXT        NOT NULL DEFAULT 'monthly'
                               CHECK (billing_cycle IN ('monthly','annual')),
  status           TEXT        NOT NULL
                               CHECK (status IN ('active','past_due','canceled','trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  trial_ends_at    TIMESTAMPTZ,
  canceled_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

#### Table: `audit_logs`

Immutable audit trail — rows are INSERT-only. No UPDATEs or DELETEs are permitted at the DB layer (enforced via row-level security policy + WORM archival to S3).

```sql
CREATE TABLE audit_logs (
  id               TEXT        PRIMARY KEY,
  org_id           TEXT        NOT NULL,             -- No FK — audit logs survive org deletion
  actor_id         TEXT,                             -- User or API key ID (nullable for system events)
  actor_email      TEXT,                             -- Snapshot at time of event
  actor_type       TEXT        NOT NULL
                               CHECK (actor_type IN ('user','api_key','system')),
  event_type       TEXT        NOT NULL,             -- e.g. 'alert.status_changed', 'api_key.created'
  resource_type    TEXT,                             -- 'alert', 'watchlist_item', 'user', etc.
  resource_id      TEXT,
  changes          JSONB,                            -- {field: {from: old, to: new}}
  request_id       TEXT,
  ip_address       INET,
  user_agent       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partition by month for efficient archival
CREATE INDEX idx_audit_org_id ON audit_logs(org_id, created_at DESC);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- Prevent all modifications (enforced via RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_insert_only ON audit_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY audit_no_update ON audit_logs FOR UPDATE USING (FALSE);
CREATE POLICY audit_no_delete ON audit_logs FOR DELETE USING (FALSE);
```

---

#### Table: `threat_actors`

```sql
CREATE TABLE threat_actors (
  id               TEXT        PRIMARY KEY,
  name             TEXT        UNIQUE NOT NULL,
  aliases          TEXT[]      NOT NULL DEFAULT '{}',
  motivation       TEXT        CHECK (motivation IN ('financial','espionage','hacktivism','destruction','unknown')),
  origin_country   TEXT,
  active_since     DATE,
  last_active_at   DATE,
  targeted_industries TEXT[]   NOT NULL DEFAULT '{}',
  primary_ttps     TEXT[]      NOT NULL DEFAULT '{}',  -- MITRE ATT&CK technique IDs
  description      TEXT,
  confidence_score REAL        CHECK (confidence_score BETWEEN 0.0 AND 1.0),
  source           TEXT,                              -- 'umbra_research', 'mitre', 'isac', etc.
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 2.2 Entity Relationship Diagram

```
organizations ──< users
      │
      ├──< watchlist_items ──< alert_watchlist_matches >──┐
      │                                                    │
      ├──< alerts ──────────────────────────────────────────┘
      │      └──< breach_credential_hashes
      │
      ├──< api_keys
      ├──< integrations
      ├──< billing_subscriptions
      └──< audit_logs (append-only)

threat_actors (global, not org-scoped)
```

---

## 3. Elasticsearch — Search & Event Indices

Elasticsearch handles full-text search and analytics across the massive volume of breach events, forum posts, and threat intelligence data collected by the pipeline.

### 3.1 Index: `breach_events`

Stores processed breach events post-normalization. One document per breach event ingested.

```json
PUT /breach_events
{
  "mappings": {
    "properties": {
      "id":              { "type": "keyword" },
      "source_type":     { "type": "keyword" },
      "source_id":       { "type": "keyword" },
      "source_name":     { "type": "keyword" },
      "source_tier":     { "type": "byte" },
      "content_type":    { "type": "keyword" },
      "malware_family":  { "type": "keyword" },
      "credential_count": { "type": "integer" },
      "email_domains":   { "type": "keyword" },      // Array: ["acme.com", "beta.com"]
      "email_hashes":    { "type": "keyword" },      // Array of SHA-256 hashes
      "keyword_mentions": { "type": "keyword" },
      "language":        { "type": "keyword" },
      "risk_score":      { "type": "short" },
      "content_snippet": { "type": "text", "analyzer": "standard" },  // Sanitized, no PII
      "raw_event_hash":  { "type": "keyword" },      // SHA-256 for dedup
      "collected_at":    { "type": "date" },
      "processed_at":    { "type": "date" },
      "harvest_date_est": { "type": "date" },
      "mitre_techniques": { "type": "keyword" },
      "ai_classification": { "type": "keyword" },
      "duplicate_of":    { "type": "keyword" }       // Reference if detected as duplicate
    }
  },
  "settings": {
    "number_of_shards": 5,
    "number_of_replicas": 1,
    "index.lifecycle.name": "breach_events_ilm_policy"
  }
}
```

**ILM Policy:** Hot → Warm (30 days) → Cold (180 days) → Delete (730 days)

---

### 3.2 Index: `forum_posts`

Stores scraped and indexed dark forum content.

```json
PUT /forum_posts
{
  "mappings": {
    "properties": {
      "id":              { "type": "keyword" },
      "forum_id":        { "type": "keyword" },
      "forum_name":      { "type": "text", "fields": { "raw": { "type": "keyword" } } },
      "thread_id":       { "type": "keyword" },
      "post_id":         { "type": "keyword" },
      "author_handle":   { "type": "keyword" },
      "content":         { "type": "text", "analyzer": "multilingual_analyzer" },
      "content_language": { "type": "keyword" },
      "sentiment":       { "type": "keyword" },      // negative, neutral, threatening
      "mentioned_brands": { "type": "keyword" },
      "mentioned_domains": { "type": "keyword" },
      "threat_signals":  { "type": "keyword" },      // Array: ['sale_offer', 'access_sale', 'ransom_demand']
      "mitre_techniques": { "type": "keyword" },
      "source_url_hash": { "type": "keyword" },
      "posted_at":       { "type": "date" },
      "collected_at":    { "type": "date" },
      "relevance_score": { "type": "float" }
    }
  },
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "multilingual_analyzer": {
          "tokenizer": "standard",
          "filter": ["lowercase", "stop", "snowball"]
        }
      }
    }
  }
}
```

---

### 3.3 Index: `paste_site_entries`

```json
PUT /paste_site_entries
{
  "mappings": {
    "properties": {
      "id":              { "type": "keyword" },
      "site":            { "type": "keyword" },       // pastebin, github_gist, ghostbin, etc.
      "paste_id":        { "type": "keyword" },
      "title":           { "type": "text" },
      "content_snippet": { "type": "text" },
      "content_hash":    { "type": "keyword" },
      "detected_secrets": {
        "type": "nested",
        "properties": {
          "type":        { "type": "keyword" },       // aws_key, github_token, api_key, etc.
          "masked_value": { "type": "keyword" },
          "confidence":  { "type": "float" }
        }
      },
      "mentioned_domains": { "type": "keyword" },
      "size_bytes":      { "type": "integer" },
      "published_at":    { "type": "date" },
      "collected_at":    { "type": "date" }
    }
  }
}
```

---

### 3.4 Index: `threat_intel_kb`

The internal threat intelligence knowledge base — enriched entities for threat actor tracking.

```json
PUT /threat_intel_kb
{
  "mappings": {
    "properties": {
      "id":              { "type": "keyword" },
      "entity_type":     { "type": "keyword" },       // threat_actor, campaign, tool, malware
      "name":            { "type": "text", "fields": { "exact": { "type": "keyword" } } },
      "aliases":         { "type": "keyword" },
      "description":     { "type": "text" },
      "tags":            { "type": "keyword" },
      "mitre_techniques": { "type": "keyword" },
      "related_entities": {
        "type": "nested",
        "properties": {
          "id":           { "type": "keyword" },
          "relationship": { "type": "keyword" }
        }
      },
      "first_observed": { "type": "date" },
      "last_observed":  { "type": "date" },
      "confidence":     { "type": "float" },
      "source":         { "type": "keyword" }
    }
  }
}
```

---

## 4. ClickHouse — Time-Series Analytics

ClickHouse powers the executive dashboards, trend analytics, and historical charts that require fast aggregations over very large datasets. Data is written here from the alert pipeline via Kafka consumers — it is a **read-optimized replica of aggregated metrics**, not a source of truth.

### 4.1 Table: `alert_metrics`

```sql
CREATE TABLE alert_metrics
(
  org_id           LowCardinality(String),
  date             Date,
  hour             DateTime,
  severity         LowCardinality(String),
  category         LowCardinality(String),
  source_type      LowCardinality(String),
  alert_count      UInt32,
  resolved_count   UInt32,
  false_pos_count  UInt32,
  avg_risk_score   Float32,
  avg_resolve_time_hours Float32
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (org_id, date, hour, severity, category)
TTL date + INTERVAL 3 YEAR;
```

---

### 4.2 Table: `collection_stats`

```sql
CREATE TABLE collection_stats
(
  source_type      LowCardinality(String),
  source_id        String,
  date             Date,
  hour             DateTime,
  events_collected UInt64,
  events_processed UInt64,
  events_matched   UInt32,
  bytes_ingested   UInt64,
  errors           UInt32,
  avg_latency_ms   Float32
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (source_type, source_id, date, hour)
TTL date + INTERVAL 1 YEAR;
```

---

### 4.3 Table: `api_usage_metrics`

```sql
CREATE TABLE api_usage_metrics
(
  org_id           LowCardinality(String),
  api_key_id       String,
  date             Date,
  endpoint         LowCardinality(String),
  method           LowCardinality(String),
  status_code      UInt16,
  request_count    UInt64,
  avg_latency_ms   Float32,
  p95_latency_ms   Float32,
  error_count      UInt32
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (org_id, date, endpoint, method, status_code)
TTL date + INTERVAL 2 YEAR;
```

---

### 4.4 Materialized Views

```sql
-- Daily alert summary per org
CREATE MATERIALIZED VIEW mv_daily_alert_summary
ENGINE = SummingMergeTree
ORDER BY (org_id, date)
AS SELECT
  org_id,
  toDate(hour) AS date,
  sum(alert_count) AS total_alerts,
  sum(resolved_count) AS total_resolved,
  avg(avg_risk_score) AS avg_risk_score
FROM alert_metrics
GROUP BY org_id, date;
```

---

## 5. Redis — Cache & Pub/Sub

Redis 7 in cluster mode serves as the high-speed layer for sessions, rate limiting, WebSocket fan-out, and hot data caching.

### 5.1 Key Patterns

| Key Pattern | TTL | Value | Purpose |
|---|---|---|---|
| `session:{session_id}` | 24h | JSON blob (user_id, org_id, scopes) | JWT session store |
| `ratelimit:{key_hash}:{window}` | 60s | Counter (INCR) | Per-key rate limiting (sliding window) |
| `watchlist_index:{domain}` | 5 min | JSON array of org IDs | Hot-path domain → org lookup for matcher |
| `org_context:{org_id}` | 10 min | JSON (plan, limits, active watchlist) | Cached org context for API auth layer |
| `alert_dedup:{fingerprint}` | 30 days | 1 (SET NX) | Prevents duplicate alert delivery |
| `ws_channel:{org_id}` | N/A | Pub/Sub channel | WebSocket fan-out channel per org |
| `report_gen:{report_id}` | 1h | JSON (status, url) | Report generation status polling |
| `llm_cache:{prompt_hash}` | 1h | JSON (summary, remediation) | LLM response cache to reduce API cost |

### 5.2 WebSocket Pub/Sub Pattern

```
Alert Engine confirms match
    │
    ▼
Redis PUBLISH ws_channel:{org_id} {alert_payload_json}
    │
    ▼
Dashboard BFF subscribes to ws_channel:{org_id}
    │
    ▼
BFF pushes JSON payload over WebSocket to all open sessions for that org
```

### 5.3 Rate Limiting Algorithm (Sliding Window Log)

```python
def check_rate_limit(key_hash: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    """
    Sliding window rate limit using Redis sorted set.
    Returns (allowed, remaining_count).
    """
    now = time.time()
    window_start = now - window_seconds
    pipe = redis.pipeline()
    pipe.zremrangebyscore(f"rl:{key_hash}", 0, window_start)
    pipe.zcard(f"rl:{key_hash}")
    pipe.zadd(f"rl:{key_hash}", {str(now): now})
    pipe.expire(f"rl:{key_hash}", window_seconds + 1)
    _, count, _, _ = pipe.execute()
    return count < limit, max(0, limit - count - 1)
```

---

## 6. AWS S3 — Object Storage Layout

```
s3://umbra-platform-{region}/
├── raw-events/
│   └── {year}/{month}/{day}/{source_type}/{event_id}.json.gz
│       TTL: 30 days → Glacier → Delete
│
├── processed-archives/
│   └── {year}/{month}/breach_events_{batch_id}.parquet.gz
│       TTL: 730 days
│
├── reports/
│   └── {org_id}/{report_id}.pdf
│       TTL: 90 days (presigned URL served for 7 days after generation)
│
├── audit-logs/
│   └── {year}/{month}/{org_id}/audit_{date}.jsonl.gz
│       WORM bucket policy: Object Lock (Compliance mode, 7 years)
│       Versioning: enabled
│
└── exports/
    └── {org_id}/{export_id}.{csv|json|stix}
        TTL: 7 days
```

**S3 Bucket Policies:**
- All buckets: server-side encryption (SSE-S3 or SSE-KMS)
- `audit-logs/`: S3 Object Lock in **Compliance mode** — no delete, no overwrite
- Public access: Blocked on all buckets
- Access: IAM role-based; no public ACLs

---

## 7. Apache Kafka — Topic Design

Kafka is the event streaming backbone. All microservice-to-microservice async communication flows through these topics (`Architecture.md` §3, §4).

### 7.1 Topic Inventory

| Topic | Producers | Consumers | Partitions | Retention | Schema |
|---|---|---|---|---|---|
| `raw.events` | Collector service | Processor service | 24 | 7 days | Avro (raw_event_v1) |
| `processed.events` | Processor service | Intelligence, Matcher, Store | 24 | 3 days | Avro (processed_event_v1) |
| `alert.candidates` | Intelligence, Matcher | Alert Engine | 12 | 1 day | Avro (alert_candidate_v1) |
| `alerts.confirmed` | Alert Engine | Notification, ClickHouse consumer | 12 | 3 days | Avro (confirmed_alert_v1) |
| `notifications.queue` | Alert Engine | Notification service | 6 | 1 day | JSON |
| `audit.events` | All services | Audit log writer | 6 | 14 days | Avro (audit_event_v1) |
| `metrics.pipeline` | All services | ClickHouse consumer | 6 | 3 days | JSON |
| `dlq.{topic_name}` | Failed consumers | DLQ processor | 3 | 30 days | Original message + error |

### 7.2 Avro Schema: `processed_event_v1`

```json
{
  "type": "record",
  "name": "ProcessedEvent",
  "namespace": "io.umbra.events.v1",
  "fields": [
    { "name": "event_id",          "type": "string" },
    { "name": "raw_event_hash",    "type": "string" },
    { "name": "source_type",       "type": "string" },
    { "name": "source_id",         "type": "string" },
    { "name": "source_tier",       "type": "int" },
    { "name": "content_type",      "type": "string" },
    { "name": "email_domains",     "type": { "type": "array", "items": "string" } },
    { "name": "email_hashes",      "type": { "type": "array", "items": "string" } },
    { "name": "malware_family",    "type": ["null", "string"], "default": null },
    { "name": "credential_count",  "type": ["null", "int"],    "default": null },
    { "name": "keyword_mentions",  "type": { "type": "array", "items": "string" } },
    { "name": "risk_score",        "type": "int" },
    { "name": "is_duplicate",      "type": "boolean" },
    { "name": "duplicate_of",      "type": ["null", "string"], "default": null },
    { "name": "collected_at",      "type": "long", "logicalType": "timestamp-millis" },
    { "name": "processed_at",      "type": "long", "logicalType": "timestamp-millis" },
    { "name": "processor_version", "type": "string" }
  ]
}
```

---

## 8. Data Flows Between Stores

```
[Collector] ──Kafka: raw.events──▶ [Processor]
                                        │
                              ┌─────────┴──────────┐
                              │                    │
                    Kafka: processed.events         │
                              │              Elasticsearch
                    ┌─────────┴──────────┐  (breach_events index)
                    │                    │
              [Intelligence]        [Matcher]
                    │                    │
                    └────────┬───────────┘
                    Kafka: alert.candidates
                             │
                       [Alert Engine]
                             │
                    ┌────────┴──────────┐
                    │                   │
              PostgreSQL           Kafka: alerts.confirmed
              (alerts table)             │
                                  ┌──────┴──────────┐
                              [Notification]     ClickHouse
                                  │           (alert_metrics)
                             Email/Slack/Webhook
                                  │
                              Redis Pub/Sub
                                  │
                             WebSocket → Dashboard
```

---

## 9. Indexing Strategy

### PostgreSQL Indexing Priorities

1. **Always indexed:** Primary keys (ULID), foreign keys, `org_id` on all tenant tables, `email` on users
2. **Composite indexes:** `(org_id, severity)`, `(org_id, status)` on `alerts` for dashboard filters
3. **Partial indexes:** `WHERE status = 'active'` on `watchlist_items` (bulk of lookups are active items)
4. **No over-indexing:** Write-heavy tables (`audit_logs`, `breach_credential_hashes`) use minimal indexes

### Elasticsearch Query Optimization

- All domain/keyword matching uses `keyword` field type (not `text`) — exact match, no tokenization
- `breach_events` uses ILM (Index Lifecycle Management) for automatic hot/warm/cold tiering
- `email_hashes` field uses `keyword` type with `doc_values` for fast aggregations
- Shard count: 5 for `breach_events` (expected to be the largest index), 3 for others

### ClickHouse

- All tables use `SummingMergeTree` or `AggregatingMergeTree` — pre-aggregated on write
- Primary sort order: `(org_id, date)` — all dashboard queries are filtered by org_id first
- Materialized views computed at insert time — no expensive query-time aggregations

---

## 10. Data Retention & Archival

Per `Architecture.md` §7 and `Requirements.md` §4:

| Data Type | Primary Store | Retention | Archival |
|---|---|---|---|
| Raw crawled events | S3 `raw-events/` | **30 days** | Deleted |
| Processed breach events | Elasticsearch | **2 years** | Parquet to S3, then deleted from ES |
| Alert records | PostgreSQL | **5 years** | Partitioned archival tables after 1 year |
| Hashed credential fingerprints | PostgreSQL | **3 years** | `expires_at` column + cron purge job |
| Audit logs | PostgreSQL + S3 WORM | **7 years** | S3 Compliance mode, immutable |
| Generated reports | S3 `reports/` | **90 days** | Deleted |
| Exports | S3 `exports/` | **7 days** | Deleted |
| Plaintext credentials | **Never persisted** | — | — |
| ClickHouse metrics | ClickHouse | **2–3 years** | TTL auto-purge |
| Redis keys | Redis | Per-key TTL (minutes to 30 days) | Evicted automatically |

---

## 11. Migration Strategy

### Tooling

- **Migrations:** [golang-migrate](https://github.com/golang-migrate/migrate) for PostgreSQL (versioned `.sql` files in `infra/migrations/`)
- **Schema registry:** Confluent Schema Registry for all Kafka Avro schemas (enforces backward compatibility)
- **Zero-downtime:** All PostgreSQL migrations use the expand-contract pattern:
  1. **Expand:** Add new column/table (backward compatible)
  2. **Deploy:** Roll out new code that writes to both old and new
  3. **Backfill:** Migrate existing data
  4. **Contract:** Remove old column/table in a subsequent release

### Migration File Naming

```
infra/migrations/
├── 0001_initial_schema.up.sql
├── 0001_initial_schema.down.sql
├── 0002_add_watchlist_labels.up.sql
├── 0002_add_watchlist_labels.down.sql
└── ...
```

---

## 12. Privacy & Credential Handling

This section specifies exactly how UMBRA implements **Privacy by Design** at the database layer (`Architecture.md` §10, `Requirements.md` §4, PRD §12):

### Credential Sanitization Pipeline

```
RAW (in-memory only, never persisted):
  email:    user@acme.com
  password: P@ssw0rd123!

DERIVED (persisted in breach_credential_hashes):
  email_hash:    SHA-256("user@acme.com")   → "0a7f3b..."
  email_domain:  "acme.com"
  password_hint: "P***w0rd12*!"             (4 non-sequential chars revealed)
  password_hash: SHA-256("P@ssw0rd123!")    → "8f2c1a..."  (for re-breach detection)

NEVER STORED:
  - Full plaintext email address
  - Full plaintext password
  - User's real name, address, or other PII from the breach source
```

### Application-Layer Encryption

Sensitive fields in PostgreSQL are encrypted at the application layer using **Vault Transit** (envelope encryption) before write:

| Table | Encrypted Fields |
|---|---|
| `users` | `mfa_totp_secret` |
| `integrations` | `config` (contains webhook secrets, SIEM tokens) |
| `api_keys` | Only `key_hash` stored (SHA-256 of raw key; raw never hits DB) |

### GDPR Right to Erasure (Offboarding)

When an organization is deleted:

1. `organizations.deleted_at` is set (soft delete)
2. Background job within 30 days:
   - Hard-deletes all `watchlist_items`, `alerts`, `breach_credential_hashes`, `api_keys`, `integrations`
   - Removes all Elasticsearch documents with `org_id` filter
   - Purges Redis keys for that org
   - S3 data: immediate delete for `reports/` and `exports/`; `audit-logs/` retained per legal obligation
3. `audit_logs` rows are retained for 7 years (legal obligation) but stripped of `actor_email` after 2 years

---

*Document maintained by: Hardik Bhaskar | UMBRA Intelligence | Database Design v1.0.0*

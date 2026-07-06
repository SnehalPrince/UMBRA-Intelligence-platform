# UMBRA — Design Document (UI/UX)

**Version:** 1.0.0
**Author:** Hardik Bhaskar
**Status:** Draft → Review
**Last Updated:** June 2026

---

## Table of Contents
1. [Design Philosophy](#1-design-philosophy)
2. [Information Architecture](#2-information-architecture)
3. [Design System](#3-design-system)
4. [Key Screens](#4-key-screens)
5. [Core User Flows](#5-core-user-flows)
6. [3D Threat Graph — Interaction Design](#6-3d-threat-graph--interaction-design)
7. [Motion & Micro-interactions](#7-motion--micro-interactions)
8. [Accessibility](#8-accessibility)
9. [Component Library](#9-component-library)

---

## 1. Design Philosophy

UMBRA's interface must feel like **mission control for an analyst, not a spreadsheet**. Three principles drive every screen:

| Principle | What it means in practice |
|---|---|
| **Signal over noise** | Default views surface only Critical/High items; everything else is one filter-click away |
| **Depth on demand** | Surface-level cards everywhere; click/tap reveals raw evidence, source, and remediation |
| **Dark-native, not dark-mode** | Built dark-first (SOC analysts work in dim rooms/NOCs) — light theme is the secondary, not the default |

**Visual tone:** Cyber-intelligence aesthetic — deep navy/near-black canvas, neon-accent severity colors, glassmorphic panels, and a 3D interactive graph as the platform's signature "wow" surface (leveraging Hardik Bhaskar's WebGL/Three.js background — see [lunakitsune.vercel.app](https://lunakitsune.vercel.app/)).

---

## 2. Information Architecture

```
UMBRA
├── Marketing Site (public, SSG)
│   ├── Home / Pricing / Docs / Blog
│   └── Sign Up / Login
│
└── App (authenticated, app.umbra.io)
    ├── Dashboard (default landing)
    ├── Threat Feed              ← filterable alert stream
    ├── Watchlist                ← domains, emails, keywords, IP ranges
    ├── Threat Graph (3D)        ← Could-have, gated by plan
    ├── Threat Actors            ← persistent adversary profiles
    ├── Reports                  ← exec PDF, CSV/JSON export, audit log
    ├── Integrations             ← Slack, SIEM, ticketing, IdP
    ├── API & Keys               ← key management, usage, OpenAPI docs link
    ├── Organization Settings    ← billing, members, RBAC roles
    └── (MSSP only) Client Switcher ← multi-tenant org picker
```

### Navigation Pattern
Persistent left rail (icons + labels, collapsible to icons-only) + top bar with org/client switcher, global search, and notification bell. No nested hamburger menus on desktop — every top-level item is one click away.

---

## 3. Design System

### Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--bg-canvas` | `#0A0E14` | App background |
| `--bg-surface` | `#10151C` | Cards, panels |
| `--bg-surface-raised` | `#161D27` | Modals, dropdowns |
| `--border-subtle` | `#222C38` | Dividers, card borders |
| `--text-primary` | `#E8EDF2` | Primary text |
| `--text-secondary` | `#8B98A9` | Secondary/meta text |
| `--accent-primary` | `#00D9FF` | Brand accent, links, active states |
| `--severity-critical` | `#FF3B5C` | Critical alerts |
| `--severity-high` | `#FF8C42` | High alerts |
| `--severity-medium` | `#FFD23F` | Medium alerts |
| `--severity-low` | `#5FD068` | Low alerts |
| `--graph-node-actor` | `#B14EFF` | Threat actor nodes (3D graph) |
| `--graph-node-asset` | `#00D9FF` | Monitored asset nodes |

### Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Hero | Space Grotesk | 600–700 | 32–48px |
| Headings | Inter | 600 | 18–28px |
| Body | Inter | 400–500 | 14–16px |
| Monospace (hashes, code, API) | JetBrains Mono | 400 | 13–14px |

### Spacing & Grid
8px base unit; 12-column responsive grid; card radius `12px`; panel radius `16px`. Max content width on dashboard: `1440px`, centered with fluid gutters below that.

### Elevation
Glassmorphic panels: `background: rgba(16,21,28,0.7)`, `backdrop-filter: blur(12px)`, `1px solid var(--border-subtle)`. Used for modals, the graph HUD overlay, and the notification drawer only — not overused on primary content cards (keeps contrast high for scanning).

---

## 4. Key Screens

### 4.1 Dashboard (Landing)
- **Top:** 4 KPI tiles — Active Critical Alerts, New This Week, Mean Time to Alert, Org Risk Score (0–100 gauge)
- **Middle:** Risk trend chart (30-day, stacked by severity) + Top 5 exposed assets list
- **Bottom:** Recent activity feed (last 10 events, click-through to Threat Feed)

### 4.2 Threat Feed
- Left: filter rail (source type, severity, date range, status, asset)
- Center: virtualized list of alert cards — severity chip, title, source, "found X minutes ago," status dropdown
- Right (on selection): detail drawer — raw evidence (masked), AI summary, remediation steps, MITRE ATT&CK tags, action buttons (resolve / escalate / export)

### 4.3 Watchlist
- Tabbed: Domains | Emails | Keywords | IP Ranges
- Table view with verification status badge (Verified / Pending DNS) and per-row "Add" inline form
- Plan-limit progress bar at top (e.g., "7 / 10 domains used — Sentinel plan")

### 4.4 Threat Graph (3D)
- Full-bleed WebGL canvas with floating glass HUD (filters, legend, search) — detailed in §6

### 4.5 Reports
- Card grid: "Generate Executive PDF," "Export CSV/JSON," "Audit Log Export"
- History table of previously generated reports with re-download links

### 4.6 Org Settings → Members & RBAC
- Member table with role dropdown (`owner` / `admin` / `analyst` / `viewer`)
- Invite-by-email flow; pending invites shown with resend/revoke actions

---

## 5. Core User Flows

### 5.1 Onboarding (≤ 5 minutes — FR-005)
```
Sign Up → Verify Email → Create Org → Add Primary Domain
   → DNS TXT Verification (auto-poll, 30s intervals)
   → Add Optional Emails/Keywords → Choose Plan (or stay Free)
   → Land on Dashboard (empty state w/ "scanning in progress" indicator)
```

### 5.2 Alert Triage
```
Notification (Slack/Email) → Click-through deep link
   → Threat Feed (pre-filtered to that alert) → Open Detail Drawer
   → Read AI Summary + Remediation → Action: Resolve / Escalate / Trigger Workflow
   → Status updates in real time across all sessions (WebSocket)
```

### 5.3 MSSP Client Switching
```
Login → Client Switcher (top bar dropdown, searchable)
   → Select Client Org → Full dashboard re-scopes to that org's data
   → Breadcrumb persists "Viewing: [Client Name]" until switched again
```

---

## 6. 3D Threat Graph — Interaction Design

- **Default view:** force-directed layout; your org's assets at center, connected to detected mentions, breach events, and (if matched) named threat actors
- **Node sizing:** scaled by severity/recency, not arbitrary — bigger nodes = more urgent
- **Interaction:** scroll to zoom, drag to orbit, click a node to open a side-panel summary (no modal — keeps the graph in view)
- **Filters (HUD):** by severity, date range, source type, "show only actors with 2+ mentions"
- **Performance guardrail:** auto-degrade to a simplified 2D force graph (D3) if WebGL is unavailable or on low-power devices — never block access to the underlying data

---

## 7. Motion & Micro-interactions

| Interaction | Motion |
|---|---|
| New Critical alert arrives | Toast slides in from top-right + severity-colored left border pulse (1 cycle, not looping) |
| Status change | Card cross-fades to new state color, 150ms ease-out |
| Graph node selection | Camera eases toward node (400ms), connected edges highlight |
| Loading states | Skeleton shimmer, never blank spinners on data-heavy views |

Motion budget: nothing animates longer than 400ms; all transitions respect `prefers-reduced-motion`.

---

## 8. Accessibility

- WCAG 2.1 AA target (NFR-14): minimum 4.5:1 contrast for body text, 3:1 for large text
- Severity is always paired with an icon + text label, never color alone (colorblind-safe)
- Full keyboard navigation across Threat Feed and Watchlist (arrow keys + Enter to open detail)
- 3D Graph has a non-visual fallback: a sortable/filterable table view toggle for screen-reader users

---

## 9. Component Library

Built on a headless component foundation (Radix primitives) styled with Tailwind + the token system above:

```
components/
├── primitives/   Button, Input, Select, Tooltip, Dialog, Drawer
├── data/         DataTable, VirtualizedList, KPITile, TrendChart
├── domain/       SeverityChip, AlertCard, AssetBadge, RiskGauge
├── graph/        GraphCanvas, GraphHUD, NodeDetailPanel
└── layout/       AppShell, SideNav, TopBar, ClientSwitcher
```

Storybook-documented; every domain component ships with a Critical/High/Medium/Low visual variant story for severity-driven QA.

---

*Document maintained by: Hardik Bhaskar | UMBRA Intelligence | Design v1.0.0*

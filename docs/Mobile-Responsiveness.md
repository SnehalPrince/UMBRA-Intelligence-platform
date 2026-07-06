# UMBRA — Mobile Responsiveness Specification

**Version:** 1.0.0
**Author:** Hardik Bhaskar
**Status:** Draft → Review
**Last Updated:** June 2026

---

## Table of Contents
1. [Responsiveness Philosophy](#1-responsiveness-philosophy)
2. [Breakpoint System](#2-breakpoint-system)
3. [Layout Adaptation by Screen](#3-layout-adaptation-by-screen)
4. [3D Threat Graph on Mobile](#4-3d-threat-graph-on-mobile)
5. [Touch & Input Adaptation](#5-touch--input-adaptation)
6. [Performance Budget on Mobile](#6-performance-budget-on-mobile)
7. [Native Mobile App Strategy](#7-native-mobile-app-strategy)
8. [PWA Considerations](#8-pwa-considerations)
9. [Device & Browser Test Matrix](#9-device--browser-test-matrix)

---

## 1. Responsiveness Philosophy

UMBRA's primary workflow (deep alert triage, the 3D graph) is **desktop-first by necessity** — SOC analysts work at multi-monitor stations. Mobile's job is **awareness and triage-lite**: see a Critical alert, understand it, take a first action (acknowledge/escalate), and hand off the deep work to desktop. We do not attempt to cram every desktop feature into mobile; we scope mobile to what's genuinely useful on a phone.

---

## 2. Breakpoint System

| Breakpoint | Width | Target Devices | Primary Layout |
|---|---|---|---|
| `xs` | < 480px | Phones (portrait) | Single column, bottom nav |
| `sm` | 480–767px | Phones (landscape), small tablets | Single column, condensed cards |
| `md` | 768–1023px | Tablets | 2-column where useful, collapsible side rail |
| `lg` | 1024–1439px | Laptops | Full side rail + content, graph usable |
| `xl` | ≥ 1440px | Desktop / multi-monitor SOC stations | Full layout, side rail + detail drawer simultaneously |

Tailwind config maps directly to these tokens (`sm`, `md`, `lg`, `xl`, `2xl`) for consistency with `TechStack.md` §2.

---

## 3. Layout Adaptation by Screen

### Dashboard
- **Desktop (lg+):** 4-up KPI tile row, trend chart + asset list side-by-side
- **Tablet (md):** KPI tiles wrap to 2×2, trend chart full-width above asset list
- **Mobile (xs/sm):** KPI tiles become a horizontal swipeable carousel; trend chart simplifies to a 7-day sparkline; asset list collapses to top-3 with "View all" link

### Threat Feed
- **Desktop:** 3-pane (filters | list | detail drawer) shown simultaneously
- **Tablet:** 2-pane; detail opens as an overlay sheet
- **Mobile:** Single-pane list; filters move to a bottom-sheet modal; tapping a card pushes a full-screen detail view (back gesture/button returns to list)

### Watchlist
- **Desktop:** Full data table with inline add-row
- **Mobile:** Card list (one watchlist item per card) with a floating action button (+) opening a bottom-sheet add form

### Threat Graph (3D)
- See §4 — distinct mobile strategy, not a naive shrink of the desktop canvas

### Reports
- **Desktop:** Card grid, 3 columns
- **Mobile:** Stacked single column; PDF generation still works, opens in a system viewer/share sheet rather than inline preview

---

## 4. 3D Threat Graph on Mobile

The WebGL graph is **available but reframed** on mobile, not stripped:

| Aspect | Desktop | Mobile |
|---|---|---|
| Layout | Full-bleed canvas + floating HUD | Full-screen canvas, HUD collapses to a single bottom toolbar |
| Interaction | Mouse drag-orbit, scroll-zoom | One-finger orbit, pinch-zoom, tap-to-select |
| Node detail | Side panel alongside graph | Bottom sheet overlay (graph stays partially visible) |
| Fallback trigger | Low-power GPU / no WebGL2 | Same logic, more common on mid-tier Android — auto-falls back to the 2D D3 force graph (`Design.md` §6) |
| Node/label density | Full label set | Labels hidden until zoom-in or tap, to avoid clutter on small screens |

---

## 5. Touch & Input Adaptation

- Minimum touch target: **44×44px** (Apple HIG / Material baseline) on all interactive elements
- Swipe gestures: swipe-to-resolve / swipe-to-escalate on Threat Feed cards (mobile only — desktop uses explicit buttons to avoid accidental triggers)
- No hover-dependent functionality — anything shown on `:hover` on desktop has a tap-equivalent (e.g., row action icons are always visible on touch devices, not hover-revealed)
- Sticky bottom nav (5 items max: Dashboard, Feed, Watchlist, Reports, More) replaces the desktop side rail below `md`

---

## 6. Performance Budget on Mobile

| Metric | Target (mobile, 4G) |
|---|---|
| First Contentful Paint | < 1.8s |
| Time to Interactive | < 3.5s |
| JS bundle (initial route) | < 180KB gzipped |
| Graph fallback trigger threshold | WebGL2 unsupported, or device memory < 4GB (`navigator.deviceMemory`) |
| Data usage awareness | Real-time WebSocket throttled to delta-only payloads; full re-sync only on reconnect |

Images and icons use responsive `srcset`/SVG; no raster assets above 100KB ship to mobile viewports.

---

## 7. Native Mobile App Strategy

Per the PRD Phase 4 roadmap, a dedicated app ships after the responsive web app proves the mobile use case:

- **Stack:** React Native + Expo (`TechStack.md` §2), sharing design tokens with the web dashboard
- **Scope (v1 of the app):** push notifications for Critical/High alerts, alert triage (resolve/escalate/false-positive), read-only KPI dashboard — **no 3D graph in v1 of the native app**
- **Why push notifications matter most:** for CISO/SOC personas, a Critical alert arriving as a push notification at 2 AM is higher-value than any in-app screen
- **Biometric unlock** (Face ID / fingerprint) required to open the app given the sensitivity of breach data

---

## 8. PWA Considerations

The web dashboard is installable as a PWA as an interim mobile solution ahead of the native app:
- Web App Manifest with maskable icon set
- Service worker caches shell + last-viewed Threat Feed page for offline review (no offline write actions — triage actions require connectivity and queue with a clear "pending sync" state if attempted offline)
- Push notifications via Web Push API where supported (Android Chrome; iOS Safari 16.4+)

---

## 9. Device & Browser Test Matrix

| Device Class | Examples | Browsers Tested |
|---|---|---|
| Flagship Android | Pixel 9, Galaxy S25 | Chrome, Samsung Internet |
| Mid-tier Android | Galaxy A-series | Chrome (graph fallback path validated here) |
| iPhone | iPhone 13–16 | Safari, Chrome iOS |
| iPad | iPad Air/Pro | Safari (md/lg breakpoint validation) |
| Desktop | Windows/macOS/Linux | Chrome, Edge, Firefox, Safari (latest 2 versions each) |

All breakpoints validated via Playwright responsive test suite as part of CI (`Architecture.md` §11, E2E stage).

---

*Document maintained by: Hardik Bhaskar | UMBRA Intelligence | Mobile Responsiveness v1.0.0*

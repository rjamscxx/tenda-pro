# Changelog

All notable changes to Tenda Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `GET /api/health` liveness endpoint — returns `{ status, time }` for uptime monitors
- Loading skeleton (`loading.tsx`) for all dashboard modules — eliminates blank-screen flashes on navigation

### Changed

**UI Polish — Phase 1 (design tokens)**
- Global CSS custom properties: `--ease-out`, `--ease-spring`, `--dur-fast/base/slow`, `--elev-1/2/3`, spacing tokens
- Utility classes: `.lift` (card hover elevation), `.press` (scale 0.97 active), `.content-in` (opacity fade-in), `.live-dot` (ember breathe pulse), `.card-glow`, `.glass`

**UI Polish — Phase 2 (motion & feedback)**
- Dashboard KPI cards, target/budget bars, and channel breakdown bars animate in with GPU-accelerated `bar-enter` keyframe
- POS category tabs, dish tiles, qty buttons, channel/discount/service buttons all have `active:scale` press feel
- Reports month pills, sort toggles, bar charts, and donut chart have `bar-enter` + `content-in` on month switch (React key re-mount)
- All `btn-primary` elements app-wide gain press feel via `:active` CSS (no JS required)

**UI Polish — Phase 3 (all pages)**
- `active:scale-[0.97/0.95/0.9]` applied to every interactive button across KDS, Sales, Expenses, Inventory, Checklists, Shifts, Waste, Payroll, Employees, Menu, Suppliers, Settings, Close-Day, and Analytics
- KDS kanban bump buttons (Start / Ready / Served / Reopen) have tactile press on tap
- `lift` hover elevation added to all `glass card-glow` card components sitewide (37 instances)

**Landing page**
- Replaced all CSS/JSX mock app showcases with 18 real Playwright screenshots captured from the smoke account (Café Lina, ember theme, 1440×900 @2x)
- Screenshots show real smoke-test data across every module — "actual data, actual design"
- Gallery description updated to reflect real-screenshot sourcing

---

## [0.1.0] - 2026-06-01

Initial public release of Tenda Pro — the all-in-one operating dashboard for Philippine restaurants and cafés.

### Added

**Core dashboard**
- KPI cards: revenue today/month, food cost %, gross margin, low-stock count
- 30-day cashflow chart (revenue vs. expenses)
- Today's top sellers and AI-powered daily push

**Sales & POS**
- Sales log with item picker, channel badges, period filters
- Full POS client: dish grid by category, order builder, VAT-aware receipt, table number, discount/service charge
- Kitchen Display System (KDS): 3-column kanban (New / Preparing / Ready), Web Audio bell, 5-second polling
- Online ordering: public QR menu doubles as self-service cart; GCash payment flow; owner inbox for confirmation

**Menu & Inventory**
- Ingredients CRUD with cost, stock, low-stock threshold, supplier linking
- Recipe builder with automatic margin calculation
- Menu Engineering Quadrant (Stars / Plowhorses / Puzzles / Dogs) — Pro
- Inventory tracking with CSV export — Pro

**Operations**
- Waste log: ingredient spoilage tracking with estimated cost
- Opening/closing checklists with per-venue templates
- Close-day summary: top sellers, expenses, waste, open tabs, email report via Brevo

**People**
- Employee management: add/edit/toggle active, pay type (daily/monthly/hourly)
- Shift & attendance tracking: clock-in/out, overtime, late hours
- Payroll runs: per-employee gross/deductions/net, pull-from-shifts automation

**Finance & Reports**
- Expense logging with categories and recurring expense support
- Supplier management
- Reports: donut charts, 90-day revenue trend, day-of-week performance, 7-day forecast, monthly P&L — Premium
- Daily digest emails with AI-generated insights

**Accounts & Billing**
- Free tier (1 venue, limited AI tokens) and Pro tier (₱399/mo via PayMongo)
- 14-day free trial; in-app plan upgrade from ProLockPage
- Admin members view

**Design & UX**
- 25 themes (ember default, sage-dark, espresso, citrus, and 22 more)
- Geist Sans typography; Geist Mono for all numbers and currency
- Command palette (⌘K) with fuzzy search across pages and actions
- Animated app intro (cart roll-in, session-gated)
- PWA-ready: service worker, manifest, app icons

**Developer**
- Next.js 15 App Router, TypeScript, Tailwind v4, Drizzle ORM, Supabase Auth
- Brevo SMTP for transactional email
- Playwright e2e smoke tests; Vitest unit test suite
- Seed tool with 7 business-type themes (café, pizzeria, karinderya, boba, burger, bakery, ramen)
- Marketing pipeline: flyer, A4 brochure, Facebook post templates

---

[unreleased]: https://github.com/rjamscxx/sizzle-app/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rjamscxx/sizzle-app/releases/tag/v0.1.0

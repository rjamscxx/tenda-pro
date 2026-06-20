# Changelog

All notable changes to Tenda Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `GET /api/health` liveness endpoint — returns `{ status, time }` for uptime monitors
- Loading skeleton (`loading.tsx`) for all dashboard modules — eliminates blank-screen flashes on navigation

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

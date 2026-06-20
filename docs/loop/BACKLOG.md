# Tenda Pro — Loop Backlog

The loop takes the **top unchecked item** under `## Queue`. Order = priority.
Each item has a `done =` line and a risk tag: **`[low-risk]`** (loop implements its
recommendation automatically) or **`[needs-decision]`** (loop writes suggestions in
`notes/` then pauses for RJ). Every item gets a design note first — see `RULES.md`.
Edit freely to steer: add items, reorder, or retag.

## Queue

- [ ] `[low-risk]` Add `/api/health` endpoint
      done = route returns 200 with `{ status, time }` (and a cheap read-only DB
      ping if safe); covered by a small test; gates green.

- [ ] `[low-risk]` Standardize empty + loading states across dashboard modules
      done = each `(dashboard)` module uses the shared `EmptyState` and a
      `loading.tsx`; one module per iteration — split into sub-items; gates green
      per module. (If a module needs a real design choice, retag `needs-decision`.)

- [ ] `[low-risk]` Add `CHANGELOG.md` (Keep a Changelog format) with `Unreleased`
      done = file exists, references the current version from `package.json`;
      gates green.

> New **features** or schema changes belong here too — tag them `[needs-decision]`
> and give acceptance criteria. The loop will brainstorm + write suggestions, then
> wait for your pick.

## In progress

_(the loop moves the current item here while working on it)_

## Needs decision

_(items the loop investigated + wrote suggestions for, awaiting RJ's pick —
each links to its `notes/NNN-<slug>.md`)_

## Blocked

_(items that couldn't go green — with a one-line reason; note kept)_

## Done

- [x] `[low-risk]` Establish a green baseline — tsc/lint/build/test/db-drift all green (2026-06-20)
- [x] `[low-risk]` Add `.env.example` — all env vars documented, !gitignore exception added (2026-06-20)
- [x] `[low-risk]` Run unit tests in CI — added `npm run test` step to ci.yml (2026-06-20)
- [x] `[low-risk]` Unit tests for `src/lib/permissions.ts` — 4 tests, all roles covered (2026-06-20)
- [x] `[low-risk]` Unit tests for `src/lib/utils.ts` — 17 tests: formatCurrency, parseCents, formatDate, cn (2026-06-20)
- [x] `[low-risk]` Unit tests for `src/lib/plan.ts` edge cases — 64 tests total; isPremium, isTrialActive, isTrial, getTrialDaysLeft, isTrialExpired, hasUsedTrial, getEffectivePlan, isAtLeast all covered (2026-06-20)
- [x] `[low-risk]` Add Playwright config + auth smoke test — playwright.config.ts + e2e/auth.spec.ts already present; test:e2e script in package.json (2026-06-20)
- [x] `[low-risk]` Playwright smoke: signup → trial starts — e2e/signup.spec.ts added; page-render + validation tests always run; full flow skips unless E2E_SIGNUP_* set (2026-06-20)

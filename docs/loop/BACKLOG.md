# Tenda Pro — Loop Backlog

The loop takes the **top unchecked item** under `## Queue`. Order = priority.
Each item has a `done =` line and a risk tag: **`[low-risk]`** (loop implements its
recommendation automatically) or **`[needs-decision]`** (loop writes suggestions in
`notes/` then pauses for RJ). Every item gets a design note first — see `RULES.md`.
Edit freely to steer: add items, reorder, or retag.

## Queue

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

- [x] `[low-risk]` Standardize loading states across dashboard modules — 6 missing `loading.tsx` shimmer skeletons added (checklists, kds, shifts, close-day, members, suppliers); EmptyState already adopted everywhere applicable (2026-06-20) → [note](notes/010-empty-loading-states.md)
- [x] `[low-risk]` Add `/api/health` endpoint — `GET /api/health` returns 200 `{ status, time }`, 3-test suite, all gates green (2026-06-20) → [note](notes/009-health-endpoint.md)
- [x] `[low-risk]` Establish a green baseline — tsc/lint/build/test/db-drift all green (2026-06-20)
- [x] `[low-risk]` Add `.env.example` — all env vars documented, !gitignore exception added (2026-06-20)
- [x] `[low-risk]` Run unit tests in CI — added `npm run test` step to ci.yml (2026-06-20)
- [x] `[low-risk]` Unit tests for `src/lib/permissions.ts` — 4 tests, all roles covered (2026-06-20)
- [x] `[low-risk]` Unit tests for `src/lib/utils.ts` — 17 tests: formatCurrency, parseCents, formatDate, cn (2026-06-20)
- [x] `[low-risk]` Unit tests for `src/lib/plan.ts` edge cases — 64 tests total; isPremium, isTrialActive, isTrial, getTrialDaysLeft, isTrialExpired, hasUsedTrial, getEffectivePlan, isAtLeast all covered (2026-06-20)
- [x] `[low-risk]` Add Playwright config + auth smoke test — playwright.config.ts + e2e/auth.spec.ts already present; test:e2e script in package.json (2026-06-20)
- [x] `[low-risk]` Playwright smoke: signup → trial starts — e2e/signup.spec.ts added; page-render + validation tests always run; full flow skips unless E2E_SIGNUP_* set (2026-06-20)

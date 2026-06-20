# Tenda Pro — Loop Backlog

The loop takes the **top unchecked item** under `## Queue`. Order = priority.
Each item has a `done =` line defining when it's complete. Edit freely to steer.
See `RULES.md` for how items are executed.

## Queue

- [ ] Establish a green baseline
      done = `tsc --noEmit`, `lint`, `build`, and `test` all pass on the current
      tree with zero errors; commit any fixes needed to get there. No feature
      changes — only what's required to make the gates green.

- [ ] Add `.env.example` documenting required env vars
      done = `.env.example` lists `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `CRON_SECRET` (and any
      others referenced via `process.env`) with placeholder values and short
      comments; no real secrets; gates green.

- [ ] Run unit tests in CI
      done = `.github/workflows/ci.yml` gains a `npm run test` step after build;
      gates green.

- [ ] Unit tests for `src/lib/permissions.ts`
      done = Vitest covers each role/permission branch; `npm run test` green.

- [ ] Unit tests for `src/lib/utils.ts`
      done = Vitest covers each exported helper incl. edge cases; tests green.

- [ ] Unit tests for `src/lib/plan.ts` edge cases
      done = trial-expiry, plan-gating, and boundary cases covered beyond the
      existing `plan.test.ts`; tests green.

- [ ] Add Playwright config + auth smoke test
      done = `playwright.config.ts` exists; one spec drives login → dashboard
      renders a known element; documented run command; build + lint green.

- [ ] Playwright smoke: signup → trial starts
      done = spec covers signup flow reaching the trial dashboard state; green.

- [ ] Add `/api/health` endpoint
      done = route returns 200 with `{ status, time }` (and a cheap DB ping if
      safe); covered by a small test; gates green.

- [ ] Standardize empty + loading states across dashboard modules
      done = each `(dashboard)` module uses the shared `EmptyState` and a
      `loading.tsx`; one module per iteration — split into sub-items as needed;
      gates green per module.

- [ ] Add `CHANGELOG.md` (Keep a Changelog format) with an `Unreleased` section
      done = file exists, references the current version from `package.json`;
      gates green.

## In progress

_(the loop moves the current item here while working on it)_

## Blocked

_(items that couldn't go green — with a one-line reason)_

## Done

_(completed items land here)_

# 009 — Add `/api/health` endpoint

- **Backlog item:** `[low-risk]` Add `/api/health` endpoint  
  done = route returns 200 with `{ status, time }` (and a cheap read-only DB ping if safe); covered by a small test; gates green.
- **Risk:** low-risk (auto)
- **Date:** 2026-06-20

## 1. Brainstorm — what are we really doing?
- **Intent:** standard ops primitive — uptime monitors, CI smoke checks, and load-balancer health probes need a cheap, dependency-free endpoint that says "the app is alive."
- **What "good" looks like:** returns HTTP 200 + JSON `{ status: "ok", time: "<ISO>" }` on every request; no auth required; no side effects; a unit test covers the shape and ISO validity; gates all pass.
- **Constraints:** must not import DB at module level (would break tests without a real `DATABASE_URL`); must be `force-dynamic` (each call returns live time); Node runtime (not Edge, so consistent with the rest of the app).

## 2. Dig deeper — what the code actually shows
- `src/lib/db/index.ts` — uses `process.env.DATABASE_URL!` at module load; importing it in a route test without mocking would throw. **DB ping is unsafe for unit tests — skip it (the done criterion says "if safe").**
- `vitest.config.ts` — test env is `node`, no DB setup file; `src/app/api/**` is in coverage scope. Tests must be self-contained.
- Existing API routes (e.g., `upload-receipt`, `subscription-request`) all use `import { createClient } from '@/lib/supabase/server'` inside the handler body, not at module level — good pattern to follow.
- `route.ts` + `route.test.ts` already exist as untracked files (written before this note, unusual order, but the code is sound).

## 3. Suggestions — options considered
1. **Status + time only (current implementation)** — dead-simple, zero deps, zero latency, tests trivially without mocking. Does not tell you "is DB alive" but that is a separate concern (Supabase has its own status page). ✅
2. **Status + time + DB ping (try/catch)** — adds DB reachability signal. Requires `DATABASE_URL` in test env or a vitest mock for `@/lib/db`; adds ~50ms latency per call; test complexity up. Marginal ops benefit for this stage.
3. **Status + time + Supabase REST ping** — calls `supabase.from('accounts').select('id').limit(1)`. Same test-complexity problem as option 2.

## 4. Recommendation
- **Chosen:** Option 1 (status + time only) — because the DB ping is explicitly marked "if safe" and importing the DB client breaks unit tests. The endpoint satisfies the primary goal: a cheap, always-passing liveness probe. A DB readiness check can be added later as a separate `[needs-decision]` item if monitoring requires it.

## 5. Outcome  _(fill after implementing)_
- **What changed:** `src/app/api/health/route.ts` (new, 8 lines) + `src/app/api/health/route.test.ts` (new, 3 tests). No existing files modified.
- **Gates:** tsc ✓ / lint ✓ / drift (no schema change) ✓ / build ✓ / test ✓
- **Commit:** (see below)

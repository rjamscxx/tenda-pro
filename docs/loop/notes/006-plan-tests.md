# 006 — Unit tests for `src/lib/plan.ts` edge cases

- **Backlog item:** `[low-risk]` Unit tests for `src/lib/plan.ts` edge cases — done = trial-expiry, plan-gating, and boundary cases covered beyond the existing `plan.test.ts`; tests green.
- **Risk:** low-risk (auto)
- **Date:** 2026-06-20

## 1. Brainstorm — what are we really doing?
- Intent: `plan.ts` is the gating layer for the entire app's paid features. A regression here would silently let free users access pro content or lock paid users out. Every function needs coverage.
- What "good" looks like: `getEffectivePlan`, `isAtLeast`, `isPremium`, `isTrial`, `getTrialDaysLeft`, `isTrialExpired`, `hasUsedTrial`, `isTrialActive` all tested with normal + boundary + edge cases.
- Constraints: Existing `plan.test.ts` only covers `isPro`. Extend it or add a new file. No production code changes.

## 2. Dig deeper — what the code actually shows
- `plan.ts` exports 8 functions + 2 constants. Only `isPro` (and transitively `isAtLeast` + `getEffectivePlan`) was tested.
- `isTrial` requires `trialStartedAt !== null AND plan === 'pro' AND planExpiresAt > now` — three conditions, multiple edge cases.
- `getTrialDaysLeft` uses `Math.ceil(msLeft / day)` — boundary: exactly 0ms left should return 0, not -1.
- `isTrialExpired` and `isTrial` are mutually exclusive: expired trial should not be "active".
- Account schema: id, plan, planExpiresAt, trialStartedAt, aiTokensToday, aiTokensDate, aiPushText, aiPushDate, createdAt.

## 3. Suggestions — options considered
1. **Extend `plan.test.ts`** — add describe blocks for the untested functions in the same file.
2. **New `plan-extra.test.ts`** — keeps the original untouched but splits the file.

Option 1 is cleaner — one file per module.

## 4. Recommendation
- **Chosen:** Option 1 — extend `plan.test.ts` with 7 new describe blocks.

## 5. Outcome
- What changed: `src/lib/plan.test.ts` extended with tests for all 7 untested functions.
- Gates: tsc ✓ lint ✓ build ✓ test ✓
- Commit: (next commit)

# 003 — Run unit tests in CI

- **Backlog item:** `[low-risk]` Run unit tests in CI — done = `.github/workflows/ci.yml` gains a `npm run test` step after build; gates green.
- **Risk:** low-risk (auto)
- **Date:** 2026-06-20

## 1. Brainstorm — what are we really doing?
- Intent: Every PR should run the test suite automatically so regressions don't sneak in.
- What "good" looks like: `ci.yml` has a test step after build; passes with current 12 tests.
- Constraints: Additive only, no changes to test suite itself.

## 2. Dig deeper — what the code actually shows
- `.github/workflows/ci.yml` already has `- name: test / run: npm run test` at lines 56-57, after the build step.
- No changes needed.

## 3. Suggestions — options considered
1. **Already done** — test step exists and is correctly placed after build.

## 4. Recommendation
- **Chosen:** No changes needed.

## 5. Outcome
- What changed: Nothing. `ci.yml` already has the test step.
- Gates: no changes to verify.
- Commit: already present in prior work.

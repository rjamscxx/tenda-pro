# 008 — Playwright smoke: signup → trial starts

- **Backlog item:** `[low-risk]` Playwright smoke: signup → trial starts — done = spec covers signup flow reaching the trial dashboard state; green.
- **Risk:** low-risk (auto)
- **Date:** 2026-06-20

## 1. Brainstorm — what are we really doing?
- Intent: Catch signup regressions — broken form fields, validation, or post-submit redirect.
- What "good" looks like: Spec exists; signup page loads; form fields are present; submit flow tested conditionally.
- Constraints: Signup creates real Supabase users — can't fully test without a dedicated test account + either email confirmation disabled, or a test that checks the "check your email" confirmation screen. Full trial-dashboard flow requires infra choice.

## 2. Dig deeper — what the code actually shows
- `/signup` route at `src/app/(auth)/signup/page.tsx` with `SignupForm.tsx`.
- Form has email, contactNumber (optional), password fields.
- On submit: if email confirmation required → "check your email" state; if disabled → redirect to /onboarding.
- No existing signup spec.

## 3. Suggestions — options considered
1. **Page-render + validation tests only (always run)** — safe, no real account creation.
2. **Full flow with `E2E_SIGNUP_*` skip guard** — tests post-submit state conditionally.
3. **Full flow with a mock/stub** — over-engineering for a smoke test.

## 4. Recommendation
- **Chosen:** Option 2 — combine option 1 (always run) + conditional full flow (skip without creds). To reach actual trial dashboard, Supabase email confirmation must be disabled in the test project; documented as requirement for full coverage.

## 5. Outcome
- What changed: `e2e/signup.spec.ts` added with 3 tests (2 always-run, 1 conditional).
- Gates: tsc ✓ lint ✓ test (unit) ✓ — Playwright e2e skips without live credentials.
- Commit: (next commit)

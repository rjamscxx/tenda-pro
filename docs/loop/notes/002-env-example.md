# 002 — Add `.env.example` documenting required env vars

- **Backlog item:** `[low-risk]` Add `.env.example` — done = `.env.example` lists all env vars with placeholder values + comments; no real secrets; gates green.
- **Risk:** low-risk (auto)
- **Date:** 2026-06-20

## 1. Brainstorm — what are we really doing?
- Intent: Any developer cloning the repo should immediately know every env var required to run the app.
- What "good" looks like: File exists, tracked by git, covers all `process.env.*` references, no real values.
- Constraints: Never touch `.env.local`. `.env.example` must be gitignored's explicit exception.

## 2. Dig deeper — what the code actually shows
- `grep -rn "process\.env\."` found 15 vars: ANTHROPIC_API_KEY, BREVO_SENDER/NAME/SMTP_USER/SMTP_PASS, CRON_SECRET, DATABASE_URL, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL, PAYMONGO_SECRET_KEY, PAYMONGO_WEBHOOK_SECRET, RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY.
- `.env.example` already exists and covers all 15 with comments and source hints.
- `.gitignore` has `.env*` with `!.env.example` exception — tracked correctly.
- `git ls-files .env.example` confirms it is committed.

## 3. Suggestions — options considered
1. **Already done** — file is complete and correctly tracked.
2. **Update if missing vars** — N/A, nothing missing.

## 4. Recommendation
- **Chosen:** No changes needed — done criterion already met.

## 5. Outcome
- What changed: Nothing. `.env.example` was already complete and committed.
- Gates: tsc ✓ lint ✓ build ✓ test ✓ — no changes to re-verify.
- Commit: already present in prior work.

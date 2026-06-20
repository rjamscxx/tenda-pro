# 007 — Add Playwright config + auth smoke test

- **Backlog item:** `[low-risk]` Add Playwright config + auth smoke test — done = `playwright.config.ts` exists; one spec drives login → dashboard renders a known element; documented run command; build + lint green.
- **Risk:** low-risk (auto)
- **Date:** 2026-06-20

## 1. Brainstorm — what are we really doing?
- Intent: Establish a browser-level smoke gate so login regressions are caught in CI.
- What "good" looks like: Config + spec exist; spec skips gracefully in CI without real credentials; `test:e2e` script documented.

## 2. Dig deeper — what the code actually shows
- `playwright.config.ts` exists with correct baseURL, chromium project, optional webServer.
- `e2e/auth.spec.ts` exists: skips if `E2E_EMAIL`/`E2E_PASSWORD` not set; drives login → nav visible.
- `package.json` has `test:e2e` and `test:e2e:ui` scripts. Playwright is in devDependencies.

## 3. Suggestions — options considered
1. **Already done** — config and spec are correct and complete.

## 4. Recommendation
- **Chosen:** No changes needed.

## 5. Outcome
- What changed: Nothing. Playwright config and auth smoke spec were already present.
- Gates: lint ✓ build ✓ test ✓ (Playwright skips in CI without credentials).
- Commit: already present in prior work.

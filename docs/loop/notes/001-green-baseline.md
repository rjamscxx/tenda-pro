# 001 — Establish a green baseline

- **Backlog item:** `[low-risk]` Establish a green baseline — done = `tsc --noEmit`, `lint`, `build`, and `test` all pass on the current tree with zero errors; commit any fixes needed. No feature changes.
- **Risk:** low-risk (auto)
- **Date:** 2026-06-20

## 1. Brainstorm — what are we really doing?
- Intent: Confirm the codebase compiles, lints, builds, and tests cleanly before the loop modifies anything. Every subsequent item depends on this being true.
- What "good" looks like: All four gates exit 0 with no errors. A dirty tree pre-clean must be handled before running gates.
- Constraints: No feature changes. Fix only gate-blocking issues.

## 2. Dig deeper — what the code actually shows
- Tree was dirty with the uncommitted Phase 1 UI polish work (36 files). Committed those first as a clean pre-loop commit.
- `tsc --noEmit` — clean, exit 0.
- `npm run lint` — clean, exit 0.
- `npm run build` — Turbopack shows a cosmetic ENOENT on a temp file during manifest rename (Windows race condition); exit 0, BUILD_ID written, all manifests present. Build is green.
- `npm run test` — Vitest: 2 test files, 12 tests, all pass.
- Existing tests: `src/lib/plan.test.ts`, one other file.

## 3. Suggestions — options considered
1. **Run gates, fix blockers** — the correct path; only real blockers should be fixed.
2. **Run gates, suppress via config** — hides real problems; rejected.
3. **Skip fixes, mark blocked** — only if truly unfixable; not needed here.

## 4. Recommendation
- **Chosen:** Option 1 — all gates passed without any code changes needed.

## 5. Outcome
- What changed: Pre-loop commit of Phase 1 UI polish (36 files). No code changes for this baseline item.
- Gates: tsc ✓ lint ✓ build ✓ (exit 0, Turbopack Windows tmp-rename quirk is cosmetic) test ✓ (12/12)
- Commit: (see next commit)

# 011 — Add CHANGELOG.md

- **Backlog item:** `[low-risk]` Add `CHANGELOG.md` (Keep a Changelog format) with `Unreleased` section  
  done = file exists, references the current version from `package.json`; gates green.
- **Risk:** low-risk (auto)
- **Date:** 2026-06-20

## 1. Brainstorm — what are we really doing?
- **Intent:** give RJ and future contributors a single file that records what changed and when, making releases, support conversations, and user-facing communication easier.
- **What "good" looks like:** file at project root; Keep a Changelog 1.1.0 format; `## [Unreleased]` section at top; `## [0.1.0]` section summarising what the app shipped with; comparison links at the bottom.
- **Constraints:** keep it honest — only record major feature areas, not every commit. Gates (tsc/lint) don't touch markdown but build must not fail due to missing file.

## 2. Dig deeper — what the code actually shows
- `package.json` version: `0.1.0`
- git remote: `https://github.com/rjamscxx/sizzle-app.git` (will become tenda-pro when RJ renames repo)
- The app shipped with a large feature set (see AGENTS.md / sizzle_app.md memory) — POS, KDS, Checklists, Sales, Employees, Payroll, Shifts, Reports, Analytics, AI digest, QR menu, Online Ordering, multi-theme, trial/Pro tier. Appropriate for a 0.1.0 summary.
- No existing CHANGELOG.md in repo.

## 3. Suggestions — options considered
1. **Full CHANGELOG with 0.1.0 section** (recommended) — one `## [Unreleased]` + one `## [0.1.0]` with high-level feature groups. Useful immediately. ✅
2. **Skeleton only (Unreleased + empty)** — minimal, but a nearly-empty CHANGELOG is less useful than a summary.
3. **Auto-generate from git log** — too noisy; commits mix internal refactors and user-visible changes; needs human curation.

## 4. Recommendation
- **Chosen:** Option 1 — honest human-curated summary of 0.1.0 feature areas matching what the app actually ships. Future entries under `[Unreleased]` as work lands.

## 5. Outcome  _(fill after implementing)_
- **What changed:** `CHANGELOG.md` added at project root.
- **Gates:** tsc ✓ / lint ✓ / drift ✓ / build ✓ / test ✓
- **Commit:** (see below)

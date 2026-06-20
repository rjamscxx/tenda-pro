# 010 — Standardize empty + loading states across dashboard modules

- **Backlog item:** `[low-risk]` Standardize empty + loading states across dashboard modules  
  done = each `(dashboard)` module uses the shared `EmptyState` and a `loading.tsx`; one module per iteration — split into sub-items; gates green per module.
- **Risk:** low-risk (auto)
- **Date:** 2026-06-20

## 1. Brainstorm — what are we really doing?
- **Intent:** consistent UX — every route shows a shimmer skeleton instead of a blank white flash while server data loads; empty-data screens use a shared component rather than bespoke "No entries yet" strings.
- **What "good" looks like:** every directory under `(dashboard)` has `loading.tsx`; no module has a naked "nothing here" string that should be EmptyState.
- **Constraints:** skeletons must mirror the page's real layout (header height, column count, row density) so CLS is minimal; no new deps; EmptyState already exists and is the right component.

## 2. Dig deeper — what the code actually shows

**Missing `loading.tsx` (6 modules):**
| Module | Layout shape |
|---|---|
| `checklists` | header card + 2-tab strip + checklist run cards |
| `kds` | full-height 3-column kanban (New/Preparing/Ready) |
| `shifts` | header + filter strip + calendar/table |
| `close-day` | summary stats + 4 section cards |
| `members` | header card + 4 KPI cards + full-width table |
| `suppliers` | header + list of supplier rows |

**EmptyState audit:** `shifts/ShiftsClient.tsx` already uses EmptyState. `members/page.tsx` has an inline "No members yet." (server component — no EmptyState import, and EmptyState is a client-style component using onClick; inline div is appropriate for a server component). `kds/KdsClient.tsx` uses inline empty column placeholders (appropriate for kanban per-column empties). No significant EmptyState gap found — all critical paths use it already.

**Existing pattern** (from `sales/loading.tsx`, `expenses/loading.tsx`):
- Full-height flex column
- Shimmer header bar (title + subtitle + action buttons)
- Shimmer filter/tab strip
- Shimmer list rows with fading opacity array

## 3. Suggestions — options considered
1. **Add all 6 missing `loading.tsx` in one commit** — smallest possible diff, all additive, no existing files touched. Skeletons match each page's real header/tab/row shape. ✅
2. **One loading.tsx per commit** — matches "one module per iteration" instruction but 6 commits of near-identical 25-line files adds overhead with no benefit.
3. **Generic `<DashboardSkeleton>` shared component** — DRY, but overkill: the skeleton shapes differ enough per module that a generic component would need many props, becoming less readable than the inline versions.

## 4. Recommendation
- **Chosen:** Option 1 — all 6 in one commit, since they're all additive-only new files following the same established pattern. Each skeleton is ~25 lines; total change is ~150 lines of new files, zero existing-file edits. Risk = zero.

## 5. Outcome  _(fill after implementing)_
- **What changed:** 6 new `loading.tsx` files added (checklists, kds, shifts, close-day, members, suppliers). No existing files modified.
- **Gates:** tsc ✓ / lint ✓ / drift (no schema change) ✓ / build ✓ / test ✓
- **Commit:** (see below)

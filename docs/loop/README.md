# Tenda Pro — Automated Loop

A backlog-driven `/loop` that hardens the app one small item at a time, fully
verified, committing locally as it goes. You stay in control by editing one file.

## The three files
| File | Role | Who owns it |
|------|------|-------------|
| `BACKLOG.md` | The work queue. Top unchecked item = next job. | **You** (edit to steer) |
| `RULES.md` | Standing rules the loop re-reads every iteration. | Stable — change rarely |
| `README.md` | This guide. | — |

## How one iteration works
1. Read `RULES.md`, then take the **top unchecked** item in `BACKLOG.md`.
2. Implement just that item.
3. Run the gates: `tsc --noEmit` → `lint` → migration drift → `build` → `test`.
4. If all green: mark the item `[x]`, commit locally (clean message, no push).
5. If not green after reasonable attempts: revert the item's changes, flag it in
   `BACKLOG.md`, move on.
6. Repeat until the backlog has no unchecked items, then stop and summarize.

## Before you launch (one-time)
- This work happens on the **`loop/backlog-run`** branch (already created).
- Commit or stash any other in-progress changes so the tree is clean — loop
  commits should contain *only* the loop's work.
- Make sure `.env.local` is populated (see `AGENTS.md` → Environment).

## Launch it
From inside `E:\SaaS\TENDA PRO\tenda-pro`, in a Claude Code session:

```
/loop work the next item in docs/loop/BACKLOG.md per docs/loop/RULES.md
```

No interval = **self-paced**: Claude finishes an item, then continues on its own.
Interrupt any time to pause; re-run the same command to resume where it left off.

## Steer it
- **Add work:** add a `- [ ]` line under `## Queue` with a `done =` criterion.
- **Reprioritize:** move items up/down — order is priority.
- **Pause a feature:** the loop skips fuzzy/feature items by design; brainstorm
  those separately, then drop the agreed spec in as a precise backlog item.

## Review & merge
The whole run is isolated on `loop/backlog-run`:
```
git log --oneline main..loop/backlog-run    # see everything the loop did
```
When happy, merge into `main` (or open a PR) and deploy as usual. To discard the
entire run, just delete the branch.

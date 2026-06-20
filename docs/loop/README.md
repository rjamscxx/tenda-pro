# Tenda Pro — Automated Loop

A backlog-driven `/loop` that improves the app one item at a time — but it doesn't
just code. Every item is **brainstormed, investigated in the real code, and written
up as suggestions before any change is made.** Low-risk items it implements and
commits locally; risky ones it pauses on for your decision.

## The files
| Path | Role | Who owns it |
|------|------|-------------|
| `BACKLOG.md` | Work queue. Top unchecked item = next job. | **You** (edit to steer) |
| `RULES.md` | Authoritative per-iteration workflow + boundaries. | Stable |
| `notes/` | One design note per item: brainstorm → findings → suggestions → outcome. | The loop writes these |
| `README.md` | This guide. | — |

## How one iteration works (the attitude)
1. **Brainstorm** — restate intent, define "good", sketch 2–3 approaches.
2. **Dig deeper** — read/grep the real files; ground the approach in what's there.
3. **Write suggestions** — `notes/NNN-<slug>.md`: options, tradeoffs, a recommendation.
4. **Risk gate**
   - low-risk → implement the recommendation, run gates, commit locally.
   - needs-decision → don't code; mark `[needs-decision]`, leave the note, move on.
5. **Verify & record** — gates green → fill the note's Outcome → mark `[x]` → commit.

Gates: `tsc --noEmit` → `lint` → migration drift → `build` → `test`.

## What "needs-decision" means
The loop pauses (writes suggestions, no code) on anything with real blast radius:
new features, schema/migrations, deletions, auth/security, billing, secrets, new
dependencies, or any item with two viable approaches that carry a tradeoff. Low-risk
hardening (tests, lint, docs, additive config) flows automatically. See `RULES.md`
→ "Risk classification".

## Before you launch (one-time)
- Work happens on **`loop/backlog-run`** (already created).
- Commit or stash unrelated in-progress changes (clean tree).
- Ensure `.env.local` is populated (see `AGENTS.md` → Environment).

## Launch it
From inside `E:\SaaS\TENDA PRO\tenda-pro`:
```
/loop work the next item in docs/loop/BACKLOG.md per docs/loop/RULES.md
```
Self-paced: it brainstorms + works items on its own, pausing only on
`needs-decision` items. Interrupt anytime; re-run to resume.

## Steer it
- **Add work:** a `- [ ]` line under `## Queue` with a `done =` criterion. Tag it
  `[needs-decision]` to force a pause-for-discussion regardless of risk.
- **Reprioritize:** reorder items — order is priority.
- **Resolve a decision:** read the item's `notes/` file, pick an option (note it on
  the backlog item, or just tell the loop), and it implements your choice next pass.

## Review & merge
```
git log --oneline main..loop/backlog-run    # everything the loop did
ls docs/loop/notes/                          # the reasoning behind each change
```
Merge into `main` (or open a PR) when happy. Delete the branch to discard the run.

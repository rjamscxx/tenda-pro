# Loop Rules (authoritative during a loop run)

Re-read this file at the start of every iteration. These rules win over a backlog
item, except an item may narrow scope (never widen the hard boundaries).

## The attitude — practice this on every item
Don't jump straight to code. Treat each item the way a thoughtful engineer would:
**brainstorm it → dig into the real code → write down suggestions → then act.**
The thinking is recorded in `docs/loop/notes/`, so every change has a paper trail
of *why*, not just *what*.

## Each iteration — five phases

### 1. Brainstorm the item
- Restate it in your own words: the real intent, and who benefits.
- Define what "good" looks like beyond the `done =` line — acceptance criteria.
- List constraints to respect (conventions, perf, security, the hard boundaries).
- Sketch 2–3 approaches at a high level.

### 2. Dig deeper — ground it in the actual code
- Investigate before deciding: grep/read the real files this item touches.
- Note existing patterns to follow (e.g. `EmptyState.tsx`, module `actions.ts`,
  existing `*.test.ts`).
- Surface gotchas, edge cases, and anything that changes the approach.

### 3. Write suggestions
- Create `docs/loop/notes/NNN-<slug>.md` from `_TEMPLATE.md` (NNN = item number).
- Record: intent, findings, 2–3 options with honest tradeoffs, and a clear
  **recommendation with reasoning** (lead with the recommended option).

### 4. Risk gate — auto vs. pause
Classify the item (see "Risk classification"):
- **Low-risk** → implement your recommended option (smallest change that meets
  acceptance). Keep going.
- **Needs-decision** → do NOT implement. Mark the item `[needs-decision]`, move it
  to `## Needs decision` in `BACKLOG.md`, leave the note with options laid out,
  and continue to the next `Queue` item. These wait for RJ.

### 5. Verify, record, commit (implemented items only)
- Run the gates in order; fix; re-run:
  `npx tsc --noEmit` → `npm run lint` → migration drift (if `schema.ts` changed,
  `npm run db:generate` + commit the migration; `supabase/migrations/` must be
  clean) → `npm run build` → `npm run test`.
- When all green: fill the note's **Outcome** section, mark the item `[x]` and move
  it to `## Done`, then commit (note + implementation together, one commit/item).

When no `Queue` items remain: **stop** and post a summary, listing every
`needs-decision` item with a one-line pointer to its note so RJ can weigh in.

## Risk classification
**Low-risk (auto-implement the recommendation):** additive, reversible work with one
clearly-best approach — adding tests; lint/type fixes; docs (`.env.example`,
`CHANGELOG`, README); empty/loading-state polish following an existing pattern; a
new isolated read-only endpoint; additive config that can't break prod.

**Needs-decision (write suggestions, then pause):** anything with real tradeoffs or
blast radius — new product features; DB schema changes / migrations; deleting or
destructively mutating data; auth / permissions / security; billing logic; touching
`.env`/secrets; adding or major-upgrading a dependency; changing a public API
contract; or any item where two viable approaches carry a user-facing tradeoff.
**When in doubt, treat it as needs-decision.**

## Commit rules
- One commit per item; stage only that item's files + its note + the `BACKLOG.md`
  update. Never `git add -A` / `git commit -a`.
- Concise, imperative, human-style messages. **No AI/Claude attribution.**

## Hard boundaries (never cross)
- **Never push, never deploy.** Local commits only.
- **Stay on `loop/backlog-run`.** Never switch or merge branches.
- **Never edit** `.env*`, secrets, CI credentials, or `package-lock.json` by hand
  (lockfile changes only via `npm install` when an approved item needs a dep).
- **No net-new product features** unless an item explicitly specifies one with
  acceptance criteria — and those are always `needs-decision`.
- Respect `AGENTS.md`: no PayMongo-specific or AI-chat-widget work unasked.

## When something goes wrong
- **Gate won't go green** after a few honest attempts: revert this item's changes so
  the tree is green again, move the item to `## Blocked` with a one-line reason (keep
  its note). Move on.
- **Item is ambiguous or bigger than one iteration:** split it into sub-items, or
  mark `needs-decision` with a note. Don't guess.
- **Tree is dirty with unrelated changes at start:** stop and ask RJ to commit/stash
  first. Never absorb his work into a loop commit.

## Scope discipline
- Small, verifiable diffs. Don't refactor unrelated code "while you're in there."

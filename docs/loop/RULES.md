# Loop Rules (authoritative during a loop run)

Re-read this file at the start of every iteration. If anything here conflicts
with a backlog item, **these rules win** — except a backlog item may narrow the
gates (never widen the boundaries).

## Each iteration
1. Take the **top unchecked** `- [ ]` item under `## Queue` in `BACKLOG.md`.
   Work exactly one item — no batching, no scope creep.
2. Implement the smallest change that satisfies the item's `done =` line.
3. Run the gates in order (stop at first failure, fix, re-run):
   - `npx tsc --noEmit`
   - `npm run lint`
   - If `src/lib/db/schema.ts` changed: `npm run db:generate` and commit the
     generated migration; the tree under `supabase/migrations/` must be clean.
   - `npm run build`
   - `npm run test`
4. Only when **all gates are green**: mark the item `[x]`, move it to `## Done`,
   and commit (see Commit rules).
5. Continue to the next item. When no unchecked items remain, **stop** and post a
   summary of what changed.

## Commit rules
- **One commit per backlog item.** Stage only the files for that item plus the
  `BACKLOG.md` update — do **not** `git add -A`.
- Message: concise, imperative, human-style. **No AI/Claude attribution**, no
  "Co-Authored-By". Example: `add unit tests for permissions role checks`.
- Never `git commit -a` blindly; there may be unrelated user changes in the tree.

## Hard boundaries (never cross)
- **Never push.** Never `git push`, never open PRs, never deploy. Local commits
  only. The user reviews and pushes manually.
- **Stay on `loop/backlog-run`.** Never switch or merge branches.
- **Never edit** `.env*`, secrets, CI credentials, or `package-lock.json` by hand
  (lockfile changes only via `npm install` when an item requires a dependency).
- **No net-new product features** unless a backlog item explicitly specifies one
  with clear acceptance criteria. Default work = hardening, tests, polish.
- Respect `AGENTS.md`: no PayMongo-specific or AI-chat-widget work unasked.

## When something goes wrong
- **Gate won't go green** after a few honest attempts: `git restore`/revert this
  item's changes so the tree returns to green, then in `BACKLOG.md` move the item
  to a `## Blocked` section with a one-line reason. Move on.
- **Item is ambiguous, too big, or feature-shaped:** don't guess. Leave it
  unchecked, add a `> note:` under it explaining what's needed, skip to the next.
- **Tree is dirty with unrelated changes at start:** stop and ask the user to
  commit/stash first. Do not absorb their work into a loop commit.

## Scope discipline
- Prefer small, verifiable diffs. If an item is bigger than one iteration, split
  it into sub-items in the backlog instead of doing it all at once.
- Don't refactor unrelated code "while you're in there."

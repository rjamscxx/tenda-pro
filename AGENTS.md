<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Tenda Pro — Project Context

All-in-one dashboard for restaurant / café owners (Philippines market).
Domain: tenda.ph. Some infra IDs still use the old "sizzle" name intentionally.

## Tech stack
- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript 5**
- **Tailwind CSS v4**
- **Supabase** for auth + storage (`@supabase/ssr`)
- **Drizzle ORM** over **Postgres** (`postgres.js`) — schema in `src/lib/db/schema.ts`
- Email via `nodemailer`, QR via `qrcode`, animation via `gsap`
- Tests: **Vitest** (unit) + **Playwright** (e2e, present but specs sparse)

## Directory map
- `src/app/(auth)/` — login, signup, forgot/reset password
- `src/app/(dashboard)/` — modules: dashboard, pos, sales, menu, inventory,
  suppliers, employees, payroll, shifts, expenses, waste, reports, analytics,
  close-day, checklists, kds, members, settings
- `src/app/api/` — route handlers (incl. `api/cron/*`, `api/paymongo/*`)
- `src/lib/` — `db/`, `supabase/`, `queries/`, `ai/`, plus `plan.ts` (trial/plan
  gating), `permissions.ts` (RBAC), `audit.ts`, `utils.ts`
- `src/components/` — `ui/`, `layout/`, `landing/`, `3d/`
- `supabase/migrations/` — committed SQL migrations (keep in sync with schema)

## Commands
| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Type-check | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Unit tests | `npm run test` |
| Coverage | `npm run test:coverage` |
| Generate migration | `npm run db:generate` (after editing `schema.ts`) |
| Apply migration | `npm run db:migrate` |

## The gates — a change is "green" only when ALL pass
Mirror of CI (`.github/workflows/ci.yml`) plus unit tests:
1. `npx tsc --noEmit`
2. `npm run lint`
3. Migration drift — after schema changes, `npm run db:generate` must produce no
   new SQL (CI fails if `supabase/migrations` has uncommitted output)
4. `npm run build`
5. `npm run test`

> CI does **not** currently run `npm run test`. Adding that step is a backlog
> item; until then, run it locally as a gate.

## Environment
`.env.local` must define: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `CRON_SECRET`.
(CI builds with placeholder values — the build must succeed with dummies.)

## Conventions
- After editing `src/lib/db/schema.ts`, always run `npm run db:generate` and
  commit the generated migration in the same change.
- Server actions live in each module's `actions.ts`; client components are
  `*Client.tsx`. Follow existing patterns (`EmptyState.tsx`, `loading.tsx`).
- **Commit style:** concise, imperative, human-style. No AI/Claude attribution.
- Don't introduce PayMongo-specific or AI-chat-widget features unless explicitly
  asked.

## Automated loop
This repo runs a backlog-driven `/loop`. See `docs/loop/README.md`. When working
inside the loop, `docs/loop/RULES.md` is authoritative.

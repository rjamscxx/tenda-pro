# Manual Supabase migrations

These SQL files hold schema changes that drizzle-kit cannot regenerate from
`src/lib/db/schema.ts`:

- **Row-Level Security policies** + the `auth_venue_ids()` helper function
- **Tables managed outside Drizzle** (e.g. `subscription_requests`, accessed via
  the raw `supabase.from(...)` client rather than via Drizzle)
- **Data backfills** (e.g. populating `users.email` from `auth.users` on the
  existing rows)

Drizzle's `db:migrate` does not touch these files. They are applied via
`npm run db:apply-manual`, which runs every `.sql` file in this folder in
lexicographic order.

## Apply order

Each file is **idempotent** (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`, etc.) so
re-running on a partially-set-up DB is safe.

1. `0003_perf_and_rls.sql` — extra perf indexes + RLS policies on every
   tenant-scoped table + the `auth_venue_ids()` SECURITY DEFINER helper.
2. `0011_subscription_requests.sql` — `subscription_requests` table for the
   manual GCash/bank-transfer upgrade flow.
3. `0012_add_email_to_users.sql` — adds `users.email` + backfills from
   `auth.users` for existing rows. The drizzle-generated `0004_quiet_human_robot`
   also adds the column (with `ADD COLUMN`, not `IF NOT EXISTS`); this file's
   `IF NOT EXISTS` makes it safe to apply in either order.

## Fresh-install setup

```bash
npm run db:migrate         # drizzle: 0000 → 0004
npm run db:apply-manual    # RLS, subscription_requests, email backfill
```

## Adding a new manual migration

Use the next available number after the highest existing one in this folder.
Numbers here are independent of `supabase/migrations/` (drizzle-tracked).
Always write idempotent DDL.

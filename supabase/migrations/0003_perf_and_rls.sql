-- ── 0003: Missing indexes + Row-Level Security ────────────────────────────────
-- Run this in the Supabase SQL editor (or via supabase db push).
-- Safe to run: all index creates use IF NOT EXISTS; RLS enable is idempotent.

-- ── Performance indexes ────────────────────────────────────────────────────────

-- FK index on sale_items.dish_id (was missing — violates best-practice rule 4.2)
CREATE INDEX IF NOT EXISTS "sale_items_dish_idx" ON "sale_items" ("dish_id");

-- Composite index for waste-log dashboard queries
-- (WHERE venue_id = X AND wasted_at >= Y — single-column indexes cannot satisfy both)
CREATE INDEX IF NOT EXISTS "waste_logs_venue_date_idx" ON "waste_logs" ("venue_id", "wasted_at");

-- ── RLS helper ─────────────────────────────────────────────────────────────────
-- Returns all venue IDs the current auth user has access to.
-- SECURITY DEFINER so it can read users/venues without recursive RLS checks.

CREATE OR REPLACE FUNCTION public.auth_venue_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(array_agg(v.id), ARRAY[]::uuid[])
  FROM venues v
  JOIN users u ON u.account_id = v.account_id
  WHERE u.id = auth.uid()
$$;

-- ── Row-Level Security ─────────────────────────────────────────────────────────
-- Policies restrict the `authenticated` role only.
-- The `postgres` superuser (used by Drizzle via the transaction pooler) bypasses
-- RLS automatically — no changes needed in the application.

-- accounts
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_owner" ON "accounts"
  FOR ALL USING (
    id IN (SELECT account_id FROM users WHERE id = auth.uid())
  );

-- users (each user sees only themselves)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_self" ON "users"
  FOR ALL USING (id = auth.uid());

-- venues
ALTER TABLE "venues" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venues_owner" ON "venues"
  FOR ALL USING (id = ANY(auth_venue_ids()));

-- dishes
ALTER TABLE "dishes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dishes_venue" ON "dishes"
  FOR ALL USING (venue_id = ANY(auth_venue_ids()));

-- ingredients
ALTER TABLE "ingredients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingredients_venue" ON "ingredients"
  FOR ALL USING (venue_id = ANY(auth_venue_ids()));

-- recipe_items (join through dish for venue check)
ALTER TABLE "recipe_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipe_items_venue" ON "recipe_items"
  FOR ALL USING (
    dish_id IN (SELECT id FROM dishes WHERE venue_id = ANY(auth_venue_ids()))
  );

-- sales
ALTER TABLE "sales" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_venue" ON "sales"
  FOR ALL USING (venue_id = ANY(auth_venue_ids()));

-- sale_items (join through sale for venue check)
ALTER TABLE "sale_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_items_venue" ON "sale_items"
  FOR ALL USING (
    sale_id IN (SELECT id FROM sales WHERE venue_id = ANY(auth_venue_ids()))
  );

-- expenses
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_venue" ON "expenses"
  FOR ALL USING (venue_id = ANY(auth_venue_ids()));

-- waste_logs
ALTER TABLE "waste_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waste_logs_venue" ON "waste_logs"
  FOR ALL USING (venue_id = ANY(auth_venue_ids()));

-- employees
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees_venue" ON "employees"
  FOR ALL USING (venue_id = ANY(auth_venue_ids()));

-- payroll_runs
ALTER TABLE "payroll_runs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll_runs_venue" ON "payroll_runs"
  FOR ALL USING (venue_id = ANY(auth_venue_ids()));

-- payroll_items (join through payroll_run for venue check)
ALTER TABLE "payroll_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll_items_venue" ON "payroll_items"
  FOR ALL USING (
    payroll_run_id IN (SELECT id FROM payroll_runs WHERE venue_id = ANY(auth_venue_ids()))
  );

-- audit_logs (read-only for venue members; writes come from postgres/service_role only)
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_read" ON "audit_logs"
  FOR SELECT USING (venue_id = ANY(auth_venue_ids()));

-- Compound indexes for common dashboard/reports filter patterns.
-- These replace two separate index scans (venue + date) with one efficient scan.

CREATE INDEX IF NOT EXISTS "sales_venue_date_idx"
  ON "sales" ("venue_id", "sold_at");

CREATE INDEX IF NOT EXISTS "expenses_venue_date_idx"
  ON "expenses" ("venue_id", "expensed_at");

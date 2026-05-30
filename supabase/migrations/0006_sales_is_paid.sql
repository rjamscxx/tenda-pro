-- Add is_paid to sales so owners can mark open tabs / utang / pending GCash
-- separately from settled sales. Defaults true for backwards compatibility with
-- the prior assumption that every logged sale was already paid.
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "is_paid" boolean NOT NULL DEFAULT true;

-- Partial index lets the unpaid filter scan only outstanding tickets, which is
-- the small minority of rows in practice.
CREATE INDEX IF NOT EXISTS "sales_venue_unpaid_idx"
  ON "sales" ("venue_id") WHERE "is_paid" = false;

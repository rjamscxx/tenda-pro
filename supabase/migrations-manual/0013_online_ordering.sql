-- Online ordering on the public QR menu (/m/[venueId]).
-- Venues opt in and set their own GCash details; customers order + pay to that
-- GCash (no processor cut), and the order lands as a pending online sale the
-- owner confirms after verifying payment. All idempotent (IF NOT EXISTS).

-- Venue payment + opt-in
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "online_ordering_enabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "gcash_number" text;
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "gcash_name" text;

-- Sale columns for online orders
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "customer_phone" text;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "payment_ref" text;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "is_online" boolean NOT NULL DEFAULT false;

-- Owners poll for incoming online orders (online + unpaid) — keep it cheap.
CREATE INDEX IF NOT EXISTS "sales_venue_online_pending_idx"
  ON "sales" ("venue_id")
  WHERE "is_online" = true AND "is_paid" = false;

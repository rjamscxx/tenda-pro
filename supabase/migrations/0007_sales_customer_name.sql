-- Optional name on the order. Mainly used in cafés so the barista can call
-- the customer when food is ready ("Order for Lina!"). Kept separate from
-- sales.note so the latter remains for kitchen-side special instructions.
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "customer_name" text;

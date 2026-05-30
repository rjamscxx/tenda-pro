-- Employee shift logs — clock-in / clock-out audit trail.
-- One row per shift; clocked_out_at IS NULL means "currently on shift".

CREATE TABLE IF NOT EXISTS "shifts" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "venue_id"        uuid NOT NULL REFERENCES "venues"("id") ON DELETE CASCADE,
  "employee_id"     uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "clocked_in_at"   timestamptz NOT NULL DEFAULT now(),
  "clocked_out_at"  timestamptz,
  "clocked_in_by"   uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "clocked_out_by"  uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "note"            text,
  "created_at"      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "shifts_venue_idx"     ON "shifts" ("venue_id");
CREATE INDEX IF NOT EXISTS "shifts_employee_idx"  ON "shifts" ("employee_id");
CREATE INDEX IF NOT EXISTS "shifts_clocked_in_idx" ON "shifts" ("clocked_in_at");

-- Partial unique index: at most one open shift per employee at a time.
CREATE UNIQUE INDEX IF NOT EXISTS "shifts_one_open_per_employee"
  ON "shifts" ("employee_id") WHERE "clocked_out_at" IS NULL;

-- Shifts — modeled on the grayscale-coffee-club barista shift system.
-- One row per (employee, shift_date). Preset shift types (opening/mid/
-- closing/full/custom) plus attendance status. Pay computed and snapshotted
-- at save time so future rate changes don't retroactively rewrite history.

DO $$ BEGIN
  CREATE TYPE shift_type AS ENUM ('opening','mid','closing','full','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE shift_status AS ENUM ('present','late','absent','leave');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "shifts" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "venue_id"      uuid NOT NULL REFERENCES "venues"("id") ON DELETE CASCADE,
  "employee_id"   uuid NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "shift_date"    date NOT NULL,
  "shift_type"    shift_type   NOT NULL DEFAULT 'opening',
  "status"        shift_status NOT NULL DEFAULT 'present',
  "time_in"       text,                            -- 'HH:MM' venue-local
  "time_out"      text,                            -- 'HH:MM' venue-local
  "hours_worked"  numeric(5,2) NOT NULL DEFAULT 0,
  "ot_hours"      numeric(5,2) NOT NULL DEFAULT 0,
  "late_hours"    numeric(5,2) NOT NULL DEFAULT 0,
  "gross_pay"     integer      NOT NULL DEFAULT 0, -- cents, snapshot of (hours+ot−late) × hourly_rate
  "note"          text,
  "created_by"    uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at"    timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT shifts_one_per_employee_per_day UNIQUE (employee_id, shift_date)
);

CREATE INDEX IF NOT EXISTS "shifts_venue_idx"     ON "shifts" ("venue_id");
CREATE INDEX IF NOT EXISTS "shifts_employee_idx"  ON "shifts" ("employee_id");
CREATE INDEX IF NOT EXISTS "shifts_date_idx"      ON "shifts" ("shift_date");
CREATE INDEX IF NOT EXISTS "shifts_venue_date_idx" ON "shifts" ("venue_id", "shift_date");

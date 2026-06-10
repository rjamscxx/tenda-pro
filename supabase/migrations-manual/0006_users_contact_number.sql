-- Capture contact number at signup so admins can reach members.
-- Nullable since existing rows have no value and the column is optional
-- at runtime (signup form skips it if the user leaves it blank).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contact_number" text;

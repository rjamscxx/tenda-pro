-- 'hourly' is in schema.ts pay_type enum but was never added to the live DB
-- (drift between schema and committed migrations — caught in production by
-- "invalid input value for enum pay_type: 'hourly'" when adding an employee).
-- Guarded with IF NOT EXISTS so this is safe to apply on any DB state.
ALTER TYPE "public"."pay_type" ADD VALUE IF NOT EXISTS 'hourly';

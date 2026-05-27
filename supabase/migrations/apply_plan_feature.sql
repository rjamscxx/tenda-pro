-- Sizzle schema additions — safe to run even if partial schema already exists
-- Run this in Supabase SQL Editor

-- 1. Create plan enum (skips if already exists)
DO $$ BEGIN
  CREATE TYPE "public"."plan" AS ENUM('free', 'pro');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Add plan columns to accounts
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "plan" "plan" DEFAULT 'free' NOT NULL;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "plan_expires_at" timestamp with time zone;

-- 3. Add food cost target to venues (percentage integer, default 35 = 35%)
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "food_cost_target" integer DEFAULT 35 NOT NULL;

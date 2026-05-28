-- 'premium' was added to the plan enum out-of-band via apply_plan_feature.sql;
-- guard with IF NOT EXISTS so this is safe to apply on a DB that already has it.
ALTER TYPE "public"."plan" ADD VALUE IF NOT EXISTS 'premium';--> statement-breakpoint

-- AI token budget tracking (Premium feature)
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "ai_tokens_today" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "ai_tokens_date" date;--> statement-breakpoint

-- Public menu theme — schema/migration drift catch-up
ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "menu_theme" text DEFAULT 'sage-dark' NOT NULL;

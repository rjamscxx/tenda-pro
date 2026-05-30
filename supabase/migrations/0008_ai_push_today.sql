-- Cached daily "AI push" insight per account. Generated once per venue-local
-- day so repeat dashboard loads are free; Lina can hit Refresh to regenerate.
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "ai_push_text" text;
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "ai_push_date" date;

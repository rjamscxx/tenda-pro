-- Trial tracking + AI token usage per account
-- Run in Supabase SQL editor (IF NOT EXISTS safe)

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS trial_started_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_tokens_today   INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_tokens_date    DATE;

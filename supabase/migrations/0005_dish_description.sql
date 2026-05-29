-- Add optional description to dishes so the public QR menu can show real
-- item descriptions like a real restaurant menu.
ALTER TABLE "dishes" ADD COLUMN IF NOT EXISTS "description" text;

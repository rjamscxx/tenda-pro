ALTER TABLE "daily_digests" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "daily_digests" CASCADE;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "trial_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "food_cost_target" integer DEFAULT 35 NOT NULL;--> statement-breakpoint
CREATE INDEX "expenses_venue_date_idx" ON "expenses" USING btree ("venue_id","expensed_at");--> statement-breakpoint
CREATE INDEX "sales_venue_date_idx" ON "sales" USING btree ("venue_id","sold_at");
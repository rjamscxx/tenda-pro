CREATE TYPE "public"."checklist_kind" AS ENUM('opening', 'closing');--> statement-breakpoint
CREATE TYPE "public"."kitchen_status" AS ENUM('new', 'preparing', 'ready', 'served');--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_run_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"checked_at" timestamp with time zone,
	"checked_by" uuid
);
--> statement-breakpoint
CREATE TABLE "checklist_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"template_id" uuid,
	"kind" "checklist_kind" NOT NULL,
	"run_date" date NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"note" text,
	CONSTRAINT "checklist_runs_one_per_day" UNIQUE("venue_id","kind","run_date")
);
--> statement-breakpoint
CREATE TABLE "checklist_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"kind" "checklist_kind" NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_templates_one_per_kind" UNIQUE("venue_id","kind")
);
--> statement-breakpoint
ALTER TABLE "venues" ALTER COLUMN "menu_theme" SET DEFAULT 'ember';--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "customer_phone" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "payment_ref" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "is_online" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "kitchen_status" "kitchen_status" DEFAULT 'served' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "kitchen_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "kitchen_ready_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "kitchen_served_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contact_number" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "online_ordering_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "gcash_number" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "gcash_name" text;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_run_items" ADD CONSTRAINT "checklist_run_items_run_id_checklist_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."checklist_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_run_items" ADD CONSTRAINT "checklist_run_items_checked_by_users_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checklist_items_template_idx" ON "checklist_items" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "checklist_run_items_run_idx" ON "checklist_run_items" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "checklist_runs_venue_idx" ON "checklist_runs" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "checklist_runs_date_idx" ON "checklist_runs" USING btree ("run_date");--> statement-breakpoint
CREATE INDEX "checklist_templates_venue_idx" ON "checklist_templates" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "sales_venue_kitchen_active_idx" ON "sales" USING btree ("venue_id") WHERE "sales"."kitchen_status" <> 'served';
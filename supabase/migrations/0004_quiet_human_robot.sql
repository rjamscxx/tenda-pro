CREATE TYPE "public"."shift_status" AS ENUM('present', 'late', 'absent', 'leave');--> statement-breakpoint
CREATE TYPE "public"."shift_type" AS ENUM('opening', 'mid', 'closing', 'full', 'custom');--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"shift_date" date NOT NULL,
	"shift_type" "shift_type" DEFAULT 'opening' NOT NULL,
	"status" "shift_status" DEFAULT 'present' NOT NULL,
	"time_in" text,
	"time_out" text,
	"hours_worked" numeric(5, 2) DEFAULT '0' NOT NULL,
	"ot_hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"late_hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"gross_pay" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shifts_one_per_employee_per_day" UNIQUE("employee_id","shift_date")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"phone" text,
	"email" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "ai_push_text" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "ai_push_date" date;--> statement-breakpoint
ALTER TABLE "dishes" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "customer_name" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "is_paid" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shifts_venue_idx" ON "shifts" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "shifts_employee_idx" ON "shifts" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "shifts_date_idx" ON "shifts" USING btree ("shift_date");--> statement-breakpoint
CREATE INDEX "shifts_venue_date_idx" ON "shifts" USING btree ("venue_id","shift_date");--> statement-breakpoint
CREATE INDEX "suppliers_venue_idx" ON "suppliers" USING btree ("venue_id");--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ingredients_supplier_idx" ON "ingredients" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "sales_venue_unpaid_idx" ON "sales" USING btree ("venue_id") WHERE "sales"."is_paid" = false;--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"old_value" text,
	"new_value" text,
	"performed_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_ref" varchar NOT NULL,
	"room_id" integer NOT NULL,
	"guest_name" varchar NOT NULL,
	"contact_number" varchar,
	"check_in_date" date NOT NULL,
	"check_out_date" date NOT NULL,
	"occupants_count" integer NOT NULL,
	"status" varchar DEFAULT 'RESERVED' NOT NULL,
	"payment_status" varchar DEFAULT 'CURRENT' NOT NULL,
	"deposit_deadline" timestamp with time zone NOT NULL,
	"final_due_date" timestamp with time zone,
	"deposit_pct_snapshot" numeric(5, 2) NOT NULL,
	"cancellation_reason" text,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "bookings_booking_ref_unique" UNIQUE("booking_ref")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"deposit_percentage" numeric(5, 2) NOT NULL,
	"deposit_deadline_hours" integer NOT NULL,
	"grace_period_days" integer NOT NULL,
	"property_name" varchar,
	"property_address" varchar,
	"contact_phone" varchar,
	"currency_symbol" varchar DEFAULT '$' NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_number" varchar NOT NULL,
	"type" varchar NOT NULL,
	"capacity" integer NOT NULL,
	"base_price" numeric(19, 4) NOT NULL,
	"status" varchar DEFAULT 'AVAILABLE' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_room_number_unique" UNIQUE("room_number")
);
--> statement-breakpoint
CREATE TABLE "ledger_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"type" varchar NOT NULL,
	"category" varchar NOT NULL,
	"amount" numeric(19, 4) NOT NULL,
	"description" text,
	"payment_method" varchar,
	"reference_number" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"password" text NOT NULL,
	"role" varchar DEFAULT 'STAFF' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;
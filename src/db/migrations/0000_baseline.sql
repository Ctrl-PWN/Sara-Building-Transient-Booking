CREATE TYPE "public"."booking_payment_status" AS ENUM('CURRENT', 'OVERDUE', 'PAID_IN_FULL');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'EVICTED', 'TRANSFERRED');--> statement-breakpoint
CREATE TYPE "public"."booking_type" AS ENUM('DAILY', 'MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."ledger_transaction_category" AS ENUM('ROOM_CHARGE', 'DEPOSIT', 'PAYMENT', 'REFUND', 'LATE_FEE');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'GCASH', 'BANK_TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('AVAILABLE', 'MAINTENANCE', 'OUT_OF_ORDER', 'OCCUPIED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'staff');--> statement-breakpoint
CREATE TYPE "public"."utility_type" AS ENUM('ELECTRICITY', 'WATER', 'INTERNET', 'OTHER');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_ref" varchar NOT NULL,
	"room_id" integer NOT NULL,
	"contact_number" varchar,
	"occupants_count" integer NOT NULL,
	"status" "booking_status" DEFAULT 'RESERVED' NOT NULL,
	"payment_status" "booking_payment_status" DEFAULT 'CURRENT' NOT NULL,
	"booking_type" "booking_type" DEFAULT 'DAILY' NOT NULL,
	"transferred_from_booking_ref" varchar,
	"deposit_deadline" timestamp with time zone NOT NULL,
	"final_due_date" timestamp with time zone,
	"deposit_pct_snapshot" numeric(5, 2) NOT NULL,
	"cancellation_reason" text,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"address" text DEFAULT '',
	"check_in" timestamp with time zone,
	"check_out" timestamp with time zone,
	CONSTRAINT "bookings_booking_ref_unique" UNIQUE("booking_ref")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"phone" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'staff' NOT NULL,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"category" "ledger_transaction_category" NOT NULL,
	"amount" numeric(19, 4) NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"description" text,
	"payment_method" "payment_method",
	"reference_number" varchar,
	"utility_type" "utility_type",
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_number" varchar NOT NULL,
	"type" varchar NOT NULL,
	"capacity" integer NOT NULL,
	"base_price" numeric(19, 4) NOT NULL,
	"monthly_price" numeric(19, 4),
	"status" "room_status" DEFAULT 'AVAILABLE' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");
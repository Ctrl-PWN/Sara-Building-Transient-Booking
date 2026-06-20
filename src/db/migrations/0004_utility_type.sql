CREATE TYPE "public"."utility_type" AS ENUM('ELECTRICITY', 'WATER', 'INTERNET', 'OTHER');--> statement-breakpoint
ALTER TABLE "ledger_transactions" ADD COLUMN "utility_type" "public"."utility_type";

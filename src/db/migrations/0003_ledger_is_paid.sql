ALTER TABLE "ledger_transactions" ADD COLUMN "is_paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ledger_transactions" DROP COLUMN "type";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."ledger_transaction_type";

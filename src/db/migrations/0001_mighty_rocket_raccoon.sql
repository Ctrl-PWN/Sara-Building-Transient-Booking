ALTER TABLE "bookings" ADD COLUMN "first_name" varchar;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "last_name" varchar;
--> statement-breakpoint
UPDATE "bookings" SET
  "first_name" = SPLIT_PART("guest_name", ' ', 1),
  "last_name" = CASE
    WHEN POSITION(' ' IN "guest_name") > 0
    THEN SUBSTR("guest_name" FROM POSITION(' ' IN "guest_name") + 1)
    ELSE ''
  END
WHERE "guest_name" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "first_name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "last_name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "guest_name";

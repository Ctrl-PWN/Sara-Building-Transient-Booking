-- Promote plain `timestamp` columns to `timestamptz`.
-- Existing values were stored as UTC wall-clock instants (Neon default).
-- Skips columns already using `timestamp with time zone`.

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'bookings'
			AND column_name = 'created_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "bookings"
			ALTER COLUMN "created_at"
			SET DATA TYPE timestamp with time zone
			USING "created_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'account'
			AND column_name = 'access_token_expires_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "account"
			ALTER COLUMN "access_token_expires_at"
			SET DATA TYPE timestamp with time zone
			USING "access_token_expires_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'account'
			AND column_name = 'refresh_token_expires_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "account"
			ALTER COLUMN "refresh_token_expires_at"
			SET DATA TYPE timestamp with time zone
			USING "refresh_token_expires_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'account'
			AND column_name = 'created_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "account"
			ALTER COLUMN "created_at"
			SET DATA TYPE timestamp with time zone
			USING "created_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'account'
			AND column_name = 'updated_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "account"
			ALTER COLUMN "updated_at"
			SET DATA TYPE timestamp with time zone
			USING "updated_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'session'
			AND column_name = 'expires_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "session"
			ALTER COLUMN "expires_at"
			SET DATA TYPE timestamp with time zone
			USING "expires_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'session'
			AND column_name = 'created_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "session"
			ALTER COLUMN "created_at"
			SET DATA TYPE timestamp with time zone
			USING "created_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'session'
			AND column_name = 'updated_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "session"
			ALTER COLUMN "updated_at"
			SET DATA TYPE timestamp with time zone
			USING "updated_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'user'
			AND column_name = 'created_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "user"
			ALTER COLUMN "created_at"
			SET DATA TYPE timestamp with time zone
			USING "created_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'user'
			AND column_name = 'updated_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "user"
			ALTER COLUMN "updated_at"
			SET DATA TYPE timestamp with time zone
			USING "updated_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'user'
			AND column_name = 'ban_expires'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "user"
			ALTER COLUMN "ban_expires"
			SET DATA TYPE timestamp with time zone
			USING "ban_expires" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'verification'
			AND column_name = 'expires_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "verification"
			ALTER COLUMN "expires_at"
			SET DATA TYPE timestamp with time zone
			USING "expires_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'verification'
			AND column_name = 'created_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "verification"
			ALTER COLUMN "created_at"
			SET DATA TYPE timestamp with time zone
			USING "created_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'verification'
			AND column_name = 'updated_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "verification"
			ALTER COLUMN "updated_at"
			SET DATA TYPE timestamp with time zone
			USING "updated_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'ledger_transactions'
			AND column_name = 'created_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "ledger_transactions"
			ALTER COLUMN "created_at"
			SET DATA TYPE timestamp with time zone
			USING "created_at" AT TIME ZONE 'UTC';
	END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'rooms'
			AND column_name = 'created_at'
			AND data_type = 'timestamp without time zone'
	) THEN
		ALTER TABLE "rooms"
			ALTER COLUMN "created_at"
			SET DATA TYPE timestamp with time zone
			USING "created_at" AT TIME ZONE 'UTC';
	END IF;
END $$;

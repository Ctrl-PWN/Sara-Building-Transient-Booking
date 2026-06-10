import {
	boolean,
	decimal,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { ledgerTransactionCategoryEnum, paymentMethodEnum } from "./enums";

export const ledgerTransactions = pgTable("ledger_transactions", {
	id: serial("id").primaryKey(),
	bookingId: integer("booking_id")
		.references(() => bookings.id)
		.notNull(),
	category: ledgerTransactionCategoryEnum("category").notNull(),
	amount: decimal("amount", { precision: 19, scale: 4 }).notNull(),
	isPaid: boolean("is_paid").notNull().default(false),
	description: text("description"),
	paymentMethod: paymentMethodEnum("payment_method"),
	referenceNumber: varchar("reference_number"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

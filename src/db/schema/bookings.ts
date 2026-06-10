import {
	date,
	decimal,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

import { bookingPaymentStatusEnum, bookingStatusEnum } from "./enums";
import { rooms } from "./rooms";

export const bookings = pgTable("bookings", {
	id: serial("id").primaryKey(),
	bookingRef: varchar("booking_ref").unique().notNull(),
	roomId: integer("room_id")
		.references(() => rooms.id)
		.notNull(),
	firstName: varchar("first_name").notNull(),
	lastName: varchar("last_name").notNull(),
	contactNumber: varchar("contact_number"),
	address: text("address").default(""),
	checkInDate: date("check_in_date").notNull(),
	checkOutDate: date("check_out_date").notNull(),
	occupantsCount: integer("occupants_count").notNull(),
	status: bookingStatusEnum("status").default("RESERVED").notNull(),
	paymentStatus: bookingPaymentStatusEnum("payment_status")
		.default("CURRENT")
		.notNull(),
	depositDeadline: timestamp("deposit_deadline", {
		withTimezone: true,
	}).notNull(),
	finalDueDate: timestamp("final_due_date", { withTimezone: true }),
	depositPctSnapshot: decimal("deposit_pct_snapshot", {
		precision: 5,
		scale: 2,
	}).notNull(),
	cancellationReason: text("cancellation_reason"),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

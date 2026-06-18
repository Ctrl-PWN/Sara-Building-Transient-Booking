import {
	decimal,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

import {
	bookingPaymentStatusEnum,
	bookingStatusEnum,
	bookingTypeEnum,
} from "./enums";
import { rooms } from "./rooms";

export const bookings = pgTable("bookings", {
	id: serial("id").primaryKey(),
	bookingRef: varchar("booking_ref").unique().notNull(),
	roomId: integer("room_id")
		.references(() => rooms.id)
		.notNull(),
	contactNumber: varchar("contact_number"),
	occupantsCount: integer("occupants_count").notNull(),
	status: bookingStatusEnum("status").default("RESERVED").notNull(),
	paymentStatus: bookingPaymentStatusEnum("payment_status")
		.default("CURRENT")
		.notNull(),
	bookingType: bookingTypeEnum("booking_type").default("DAILY").notNull(),
	transferredFromBookingRef: varchar("transferred_from_booking_ref"),
	depositDeadline: timestamp("deposit_deadline", {
		withTimezone: true,
		mode: "string",
	}).notNull(),
	finalDueDate: timestamp("final_due_date", {
		withTimezone: true,
		mode: "string",
	}),
	depositPctSnapshot: decimal("deposit_pct_snapshot", {
		precision: 5,
		scale: 2,
	}).notNull(),
	cancellationReason: text("cancellation_reason"),
	cancelledAt: timestamp("cancelled_at", {
		withTimezone: true,
		mode: "string",
	}),
	createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", {
		withTimezone: true,
		mode: "string",
	}),
	firstName: varchar("first_name").notNull(),
	lastName: varchar("last_name").notNull(),
	address: text("address").default(""),
	checkIn: timestamp("check_in", {
		withTimezone: true,
		mode: "string",
	}),
	checkOut: timestamp("check_out", {
		withTimezone: true,
		mode: "string",
	}),
});

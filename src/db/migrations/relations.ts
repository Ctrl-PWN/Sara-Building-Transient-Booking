import { relations } from "drizzle-orm/relations";
import { user, account, rooms, bookings, ledgerTransactions, session } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
}));

export const bookingsRelations = relations(bookings, ({one, many}) => ({
	room: one(rooms, {
		fields: [bookings.roomId],
		references: [rooms.id]
	}),
	ledgerTransactions: many(ledgerTransactions),
}));

export const roomsRelations = relations(rooms, ({many}) => ({
	bookings: many(bookings),
}));

export const ledgerTransactionsRelations = relations(ledgerTransactions, ({one}) => ({
	booking: one(bookings, {
		fields: [ledgerTransactions.bookingId],
		references: [bookings.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));
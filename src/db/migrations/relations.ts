import { relations } from "drizzle-orm/relations";
import { rooms, bookings } from "./schema";

export const bookingsRelations = relations(bookings, ({one}) => ({
	room: one(rooms, {
		fields: [bookings.roomId],
		references: [rooms.id]
	}),
}));

export const roomsRelations = relations(rooms, ({many}) => ({
	bookings: many(bookings),
}));
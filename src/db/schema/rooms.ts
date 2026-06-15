import {
	decimal,
	integer,
	pgTable,
	serial,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

import { roomStatusEnum } from "./enums";

export const rooms = pgTable("rooms", {
	id: serial("id").primaryKey(),
	roomNumber: varchar("room_number").unique().notNull(),
	type: varchar("type").notNull(),
	capacity: integer("capacity").notNull(),
	basePrice: decimal("base_price", { precision: 19, scale: 4 }).notNull(),
	status: roomStatusEnum("status").default("AVAILABLE").notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

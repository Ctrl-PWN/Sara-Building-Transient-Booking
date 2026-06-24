import {
	decimal,
	integer,
	pgTable,
	serial,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { roomStatusEnum } from "./enums";

export const rooms = pgTable(
	"rooms",
	{
		id: serial("id").primaryKey(),
		roomNumber: varchar("room_number").notNull(),
		type: varchar("type").notNull(),
		capacity: integer("capacity").notNull(),
		basePrice: decimal("base_price", { precision: 19, scale: 4 }).notNull(),
		monthlyPrice: decimal("monthly_price", { precision: 19, scale: 4 }),
		status: roomStatusEnum("status").default("AVAILABLE").notNull(),
		deletedAt: timestamp("deleted_at", {
			withTimezone: true,
			mode: "string",
		}),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("rooms_room_number_active_unique")
			.on(table.roomNumber)
			.where(sql`${table.deletedAt} is null`),
	],
);

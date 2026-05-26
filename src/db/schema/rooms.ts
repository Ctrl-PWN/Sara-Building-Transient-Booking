import { pgTable, serial, varchar, integer, decimal, timestamp } from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomNumber: varchar("room_number").unique().notNull(),
  type: varchar("type").notNull(),
  capacity: integer("capacity").notNull(),
  basePrice: decimal("base_price", { precision: 19, scale: 4 }).notNull(),
  status: varchar("status").default("AVAILABLE").notNull(), // AVAILABLE, MAINTENANCE, OUT_OF_ORDER, OCCUPIED
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

import { pgTable, serial, varchar, integer, decimal, text, timestamp } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";

export const ledgerTransactions = pgTable("ledger_transactions", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  type: varchar("type").notNull(), // DEPOSIT, PAYMENT, REFUND, ADJUSTMENT
  category: varchar("category").notNull(), // ROOM_CHARGE, DEPOSIT, PAYMENT, REFUND, LATE_FEE, ADJUSTMENT
  amount: decimal("amount", { precision: 19, scale: 4 }).notNull(),
  description: text("description"),
  paymentMethod: varchar("payment_method"), // CASH, CARD, BANK_TRANSFER
  referenceNumber: varchar("reference_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

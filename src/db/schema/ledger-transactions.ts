import {
  pgTable,
  serial,
  varchar,
  integer,
  decimal,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

import {
  ledgerTransactionCategoryEnum,
  ledgerTransactionTypeEnum,
  paymentMethodEnum,
} from './enums'
import { bookings } from './bookings'

export const ledgerTransactions = pgTable('ledger_transactions', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id')
    .references(() => bookings.id)
    .notNull(),
  type: ledgerTransactionTypeEnum('type').notNull(),
  category: ledgerTransactionCategoryEnum('category').notNull(),
  amount: decimal('amount', { precision: 19, scale: 4 }).notNull(),
  description: text('description'),
  paymentMethod: paymentMethodEnum('payment_method'),
  referenceNumber: varchar('reference_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

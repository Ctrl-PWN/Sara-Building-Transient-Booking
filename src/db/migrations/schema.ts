import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  unique,
  uuid,
  foreignKey,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const auditLogs = pgTable('audit_logs', {
  id: serial().primaryKey().notNull(),
  entityType: varchar('entity_type').notNull(),
  entityId: varchar('entity_id').notNull(),
  action: varchar().notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  performedBy: varchar('performed_by').notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
})

export const systemSettings = pgTable('system_settings', {
  id: serial().primaryKey().notNull(),
  depositPercentage: numeric('deposit_percentage', {
    precision: 5,
    scale: 2,
  }).notNull(),
  depositDeadlineHours: integer('deposit_deadline_hours').notNull(),
  gracePeriodDays: integer('grace_period_days').notNull(),
  propertyName: varchar('property_name'),
  propertyAddress: varchar('property_address'),
  contactPhone: varchar('contact_phone'),
  currencySymbol: varchar('currency_symbol').default('$').notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 })
    .default('0')
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
})

export const ledgerTransactions = pgTable('ledger_transactions', {
  id: serial().primaryKey().notNull(),
  bookingId: integer('booking_id').notNull(),
  type: varchar().notNull(),
  category: varchar().notNull(),
  amount: numeric({ precision: 19, scale: 4 }).notNull(),
  description: text(),
  paymentMethod: varchar('payment_method'),
  referenceNumber: varchar('reference_number'),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
})

export const users = pgTable(
  'users',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    role: text().default('staff'),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  },
  (table) => [unique('users_email_unique').on(table.email)],
)

export const rooms = pgTable('rooms', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: text().notNull(),
  price: integer().notNull(),
  status: text().default('available'),
})

export const bookings = pgTable(
  'bookings',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    guestName: text('guest_name').notNull(),
    roomId: uuid('room_id').notNull(),
    checkIn: timestamp('check_in', { mode: 'string' }).notNull(),
    checkOut: timestamp('check_out', { mode: 'string' }).notNull(),
    totalPrice: integer('total_price').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.roomId],
      foreignColumns: [rooms.id],
      name: 'bookings_room_id_rooms_id_fk',
    }),
  ],
)

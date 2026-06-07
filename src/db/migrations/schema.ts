import {
  pgTable,
  index,
  text,
  timestamp,
  foreignKey,
  serial,
  varchar,
  numeric,
  integer,
  unique,
  date,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const bookingPaymentStatus = pgEnum('booking_payment_status', [
  'CURRENT',
  'OVERDUE',
  'PAID_IN_FULL',
])
export const bookingStatus = pgEnum('booking_status', [
  'RESERVED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
  'EVICTED',
])
export const ledgerTransactionCategory = pgEnum('ledger_transaction_category', [
  'ROOM_CHARGE',
  'DEPOSIT',
  'PAYMENT',
  'REFUND',
  'LATE_FEE',
  'ADJUSTMENT',
])
export const ledgerTransactionType = pgEnum('ledger_transaction_type', [
  'DEPOSIT',
  'PAYMENT',
  'REFUND',
  'ADJUSTMENT',
])
export const paymentMethod = pgEnum('payment_method', [
  'CASH',
  'CARD',
  'BANK_TRANSFER',
  'GCASH',
])
export const roomStatus = pgEnum('room_status', [
  'AVAILABLE',
  'MAINTENANCE',
  'OUT_OF_ORDER',
  'OCCUPIED',
])
export const userRole = pgEnum('user_role', ['ADMIN', 'STAFF'])

export const verification = pgTable(
  'verification',
  {
    id: text().primaryKey().notNull(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('verification_identifier_idx').using(
      'btree',
      table.identifier.asc().nullsLast().op('text_ops'),
    ),
  ],
)

export const account = pgTable(
  'account',
  {
    id: text().primaryKey().notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      mode: 'string',
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      mode: 'string',
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('account_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'account_user_id_user_id_fk',
    }).onDelete('cascade'),
  ],
)

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

export const bookings = pgTable(
  'bookings',
  {
    id: serial().primaryKey().notNull(),
    bookingRef: varchar('booking_ref').notNull(),
    roomId: integer('room_id').notNull(),
    contactNumber: varchar('contact_number'),
    checkInDate: date('check_in_date').notNull(),
    checkOutDate: date('check_out_date').notNull(),
    occupantsCount: integer('occupants_count').notNull(),
    status: bookingStatus().default('RESERVED').notNull(),
    paymentStatus: bookingPaymentStatus('payment_status')
      .default('CURRENT')
      .notNull(),
    depositDeadline: timestamp('deposit_deadline', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    finalDueDate: timestamp('final_due_date', {
      withTimezone: true,
      mode: 'string',
    }),
    depositPctSnapshot: numeric('deposit_pct_snapshot', {
      precision: 5,
      scale: 2,
    }).notNull(),
    cancellationReason: text('cancellation_reason'),
    cancelledAt: timestamp('cancelled_at', {
      withTimezone: true,
      mode: 'string',
    }),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    firstName: varchar('first_name').notNull(),
    lastName: varchar('last_name').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.roomId],
      foreignColumns: [rooms.id],
      name: 'bookings_room_id_rooms_id_fk',
    }),
    unique('bookings_booking_ref_unique').on(table.bookingRef),
  ],
)

export const rooms = pgTable(
  'rooms',
  {
    id: serial().primaryKey().notNull(),
    roomNumber: varchar('room_number').notNull(),
    type: varchar().notNull(),
    capacity: integer().notNull(),
    basePrice: numeric('base_price', { precision: 19, scale: 4 }).notNull(),
    status: roomStatus().default('AVAILABLE').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique('rooms_room_number_unique').on(table.roomNumber)],
)

export const ledgerTransactions = pgTable(
  'ledger_transactions',
  {
    id: serial().primaryKey().notNull(),
    bookingId: integer('booking_id').notNull(),
    type: ledgerTransactionType().notNull(),
    category: ledgerTransactionCategory().notNull(),
    amount: numeric({ precision: 19, scale: 4 }).notNull(),
    description: text(),
    paymentMethod: paymentMethod('payment_method'),
    referenceNumber: varchar('reference_number'),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: 'ledger_transactions_booking_id_bookings_id_fk',
    }),
  ],
)

export const user = pgTable(
  'user',
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    role: userRole().default('STAFF').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [unique('user_email_unique').on(table.email)],
)

export const session = pgTable(
  'session',
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    token: text().notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull(),
  },
  (table) => [
    index('session_userId_idx').using(
      'btree',
      table.userId.asc().nullsLast().op('text_ops'),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: 'session_user_id_user_id_fk',
    }).onDelete('cascade'),
    unique('session_token_unique').on(table.token),
  ],
)

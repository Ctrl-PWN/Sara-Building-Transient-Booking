import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core'

export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: text('name').notNull(),

  price: integer('price').notNull(),

  status: text('status').default('available'),

})

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: text('name').notNull(),

  email: text('email').notNull().unique(),

  role: text('role').default('staff'),

  createdAt: timestamp('created_at').defaultNow(),
})

export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),

  guestName: text('guest_name').notNull(),

  roomId: uuid('room_id')
    .references(() => rooms.id)
    .notNull(),

  checkIn: timestamp('check_in').notNull(),

  checkOut: timestamp('check_out').notNull(),

  totalPrice: integer('total_price').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
})
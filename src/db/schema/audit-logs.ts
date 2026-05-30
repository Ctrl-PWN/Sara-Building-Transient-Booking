import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type').notNull(),
  entityId: varchar('entity_id').notNull(),
  action: varchar('action').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  performedBy: varchar('performed_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

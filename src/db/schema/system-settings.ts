import {
	decimal,
	integer,
	pgTable,
	serial,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const systemSettings = pgTable("system_settings", {
	id: serial("id").primaryKey(),
	depositPercentage: decimal("deposit_percentage", {
		precision: 5,
		scale: 2,
	}).notNull(),
	depositDeadlineHours: integer("deposit_deadline_hours").notNull(),
	gracePeriodDays: integer("grace_period_days").notNull(),
	propertyName: varchar("property_name"),
	propertyAddress: varchar("property_address"),
	contactPhone: varchar("contact_phone"),
	currencySymbol: varchar("currency_symbol").default("$").notNull(),
	taxRate: decimal("tax_rate", { precision: 5, scale: 2 })
		.default("0")
		.notNull(),
	updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

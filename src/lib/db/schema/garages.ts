import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export interface GarageSettings {
  defaultVatRate: number;
  laborHourlyRate: number;
  currency: string;
  timezone: string;
  lowStockAlertEnabled: boolean;
  autoReminderDays: number[];
  paymentTermsDays: number;
}

export const garages = pgTable("garages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  siret: varchar("siret", { length: 14 }).notNull().unique(),
  vatNumber: varchar("vat_number", { length: 20 }),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 10 }).notNull(),
  country: varchar("country", { length: 2 }).notNull().default("FR"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  logoUrl: text("logo_url"),
  invoicePrefix: varchar("invoice_prefix", { length: 10 }).notNull().default("FA"),
  nextInvoiceNumber: integer("next_invoice_number").notNull().default(1),
  quotePrefix: varchar("quote_prefix", { length: 10 }).notNull().default("DE"),
  nextQuoteNumber: integer("next_quote_number").notNull().default(1),
  repairOrderPrefix: varchar("repair_order_prefix", { length: 10 }).notNull().default("OR"),
  nextRepairOrderNumber: integer("next_repair_order_number").notNull().default(1),
  settings: jsonb("settings").$type<GarageSettings>().default({
    defaultVatRate: 20,
    laborHourlyRate: 50,
    currency: "EUR",
    timezone: "Europe/Paris",
    lowStockAlertEnabled: true,
    autoReminderDays: [7, 15, 30],
    paymentTermsDays: 30,
  }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { garages } from "./garages";

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull().default("individual"),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    companyName: varchar("company_name", { length: 255 }),
    siret: varchar("siret", { length: 14 }),
    vatNumber: varchar("vat_number", { length: 20 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    postalCode: varchar("postal_code", { length: 10 }),
    notes: text("notes"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("customers_garage_idx").on(table.garageId),
    index("customers_phone_idx").on(table.garageId, table.phone),
    index("customers_email_idx").on(table.garageId, table.email),
    index("customers_name_idx").on(table.garageId, table.lastName, table.firstName),
  ],
);

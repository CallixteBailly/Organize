import { pgTable, uuid, varchar, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { garages } from "./garages";
import { customers } from "./customers";

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    licensePlate: varchar("license_plate", { length: 20 }),
    vin: varchar("vin", { length: 17 }),
    brand: varchar("brand", { length: 100 }),
    model: varchar("model", { length: 100 }),
    version: varchar("version", { length: 100 }),
    year: integer("year"),
    engineType: varchar("engine_type", { length: 50 }),
    mileage: integer("mileage"),
    color: varchar("color", { length: 50 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("vehicles_garage_idx").on(table.garageId),
    index("vehicles_customer_idx").on(table.customerId),
    index("vehicles_plate_idx").on(table.garageId, table.licensePlate),
    index("vehicles_vin_idx").on(table.garageId, table.vin),
  ],
);

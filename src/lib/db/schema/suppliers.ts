import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { garages } from "./garages";

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }),
    contactName: varchar("contact_name", { length: 200 }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    website: varchar("website", { length: 255 }),
    deliveryDays: integer("delivery_days"),
    minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
    isActive: boolean("is_active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("suppliers_garage_idx").on(table.garageId)],
);

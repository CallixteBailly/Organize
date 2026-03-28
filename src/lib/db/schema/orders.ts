import { pgTable, uuid, varchar, decimal, text, timestamp, index } from "drizzle-orm/pg-core";
import { garages } from "./garages";
import { suppliers } from "./suppliers";
import { users } from "./users";
import { orderStatusEnum } from "./enums";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    orderNumber: varchar("order_number", { length: 50 }).notNull(),
    status: orderStatusEnum("status").notNull().default("draft"),
    totalHt: decimal("total_ht", { precision: 10, scale: 2 }).notNull().default("0"),
    totalTtc: decimal("total_ttc", { precision: 10, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    expectedDeliveryDate: timestamp("expected_delivery_date", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    supplierOrderRef: varchar("supplier_order_ref", { length: 100 }),
    trackingNumber: varchar("tracking_number", { length: 100 }),
    orderedBy: uuid("ordered_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("orders_garage_idx").on(table.garageId),
    index("orders_supplier_idx").on(table.supplierId),
    index("orders_status_idx").on(table.garageId, table.status),
    index("orders_date_idx").on(table.garageId, table.createdAt),
  ],
);

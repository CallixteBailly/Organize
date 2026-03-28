import { pgTable, uuid, integer, decimal, varchar, index } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { stockItems } from "./stock-items";
import { supplierCatalog } from "./supplier-catalog";

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    stockItemId: uuid("stock_item_id").references(() => stockItems.id),
    catalogEntryId: uuid("catalog_entry_id").references(() => supplierCatalog.id),
    reference: varchar("reference", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    quantityReceived: integer("quantity_received").notNull().default(0),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

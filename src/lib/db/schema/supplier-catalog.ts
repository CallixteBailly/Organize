import { pgTable, uuid, varchar, decimal, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { suppliers } from "./suppliers";
import { stockItems } from "./stock-items";

export const supplierCatalog = pgTable(
  "supplier_catalog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    stockItemId: uuid("stock_item_id").references(() => stockItems.id, {
      onDelete: "set null",
    }),
    supplierReference: varchar("supplier_reference", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
    lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("supplier_catalog_supplier_idx").on(table.supplierId),
    index("supplier_catalog_item_idx").on(table.stockItemId),
    index("supplier_catalog_ref_idx").on(table.supplierId, table.supplierReference),
  ],
);

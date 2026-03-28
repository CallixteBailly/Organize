import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { garages } from "./garages";
import { stockCategories } from "./stock-categories";

export const stockItems = pgTable(
  "stock_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => stockCategories.id, {
      onDelete: "set null",
    }),
    reference: varchar("reference", { length: 100 }).notNull(),
    barcode: varchar("barcode", { length: 100 }),
    oemReference: varchar("oem_reference", { length: 100 }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    brand: varchar("brand", { length: 100 }),
    purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
    sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
    vatRate: decimal("vat_rate", { precision: 4, scale: 2 }).notNull().default("20.00"),
    quantity: integer("quantity").notNull().default(0),
    minQuantity: integer("min_quantity").notNull().default(0),
    maxQuantity: integer("max_quantity"),
    location: varchar("location", { length: 100 }),
    unit: varchar("unit", { length: 20 }).notNull().default("piece"),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("stock_items_garage_idx").on(table.garageId),
    index("stock_items_barcode_idx").on(table.garageId, table.barcode),
    index("stock_items_reference_idx").on(table.garageId, table.reference),
    index("stock_items_category_idx").on(table.categoryId),
    index("stock_items_low_stock_idx").on(table.garageId, table.quantity, table.minQuantity),
  ],
);

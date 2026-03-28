import { pgTable, uuid, varchar, decimal, integer, index } from "drizzle-orm/pg-core";
import { quotes } from "./quotes";
import { stockItems } from "./stock-items";
import { lineTypeEnum } from "./enums";

export const quoteLines = pgTable(
  "quote_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    type: lineTypeEnum("type").notNull(),
    stockItemId: uuid("stock_item_id").references(() => stockItems.id),
    reference: varchar("reference", { length: 100 }),
    description: varchar("description", { length: 500 }).notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    vatRate: decimal("vat_rate", { precision: 4, scale: 2 }).notNull(),
    discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
    totalHt: decimal("total_ht", { precision: 10, scale: 2 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("quote_lines_quote_idx").on(table.quoteId)],
);

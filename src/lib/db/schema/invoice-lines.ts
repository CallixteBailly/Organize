import { pgTable, uuid, varchar, decimal, integer, index } from "drizzle-orm/pg-core";
import { invoices } from "./invoices";
import { stockItems } from "./stock-items";
import { lineTypeEnum } from "./enums";

export const invoiceLines = pgTable(
  "invoice_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    type: lineTypeEnum("type").notNull(),
    stockItemId: uuid("stock_item_id").references(() => stockItems.id),
    reference: varchar("reference", { length: 100 }),
    description: varchar("description", { length: 500 }).notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    vatRate: decimal("vat_rate", { precision: 4, scale: 2 }).notNull(),
    discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
    totalHt: decimal("total_ht", { precision: 10, scale: 2 }).notNull(),
    totalVat: decimal("total_vat", { precision: 10, scale: 2 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("invoice_lines_invoice_idx").on(table.invoiceId)],
);

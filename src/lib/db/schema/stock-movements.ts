import { pgTable, uuid, integer, decimal, text, timestamp, index } from "drizzle-orm/pg-core";
import { garages } from "./garages";
import { stockItems } from "./stock-items";
import { users } from "./users";
import { stockMovementTypeEnum } from "./enums";

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    stockItemId: uuid("stock_item_id")
      .notNull()
      .references(() => stockItems.id, { onDelete: "cascade" }),
    type: stockMovementTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
    reason: text("reason"),
    repairOrderId: uuid("repair_order_id"),
    orderId: uuid("order_id"),
    performedBy: uuid("performed_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("stock_movements_garage_idx").on(table.garageId),
    index("stock_movements_item_idx").on(table.stockItemId),
    index("stock_movements_date_idx").on(table.garageId, table.createdAt),
  ],
);

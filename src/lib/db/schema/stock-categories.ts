import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { garages } from "./garages";

export const stockCategories = pgTable(
  "stock_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    parentId: uuid("parent_id"),
    color: varchar("color", { length: 7 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("stock_categories_garage_idx").on(table.garageId)],
);

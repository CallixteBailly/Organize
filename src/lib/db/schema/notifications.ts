import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { garages } from "./garages";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "stock_low",
  "invoice_overdue",
  "invoice_paid",
  "quote_expired",
  "quote_accepted",
  "repair_order_completed",
  "repair_order_assigned",
  "customer_created",
  "customer_created_ai",
  "order_delivered",
  "payment_received",
  "user_action",
  "system",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    link: varchar("link", { length: 500 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    isRead: boolean("is_read").notNull().default(false),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_garage_user_idx").on(table.garageId, table.userId),
    index("notifications_garage_unread_idx").on(table.garageId, table.userId, table.isRead),
    index("notifications_created_at_idx").on(table.garageId, table.createdAt),
  ],
);

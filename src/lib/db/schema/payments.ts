import { pgTable, uuid, decimal, text, timestamp, index } from "drizzle-orm/pg-core";
import { garages } from "./garages";
import { invoices } from "./invoices";
import { paymentMethodEnum } from "./enums";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    method: paymentMethodEnum("method").notNull(),
    reference: text("reference"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("payments_garage_idx").on(table.garageId),
    index("payments_invoice_idx").on(table.invoiceId),
  ],
);

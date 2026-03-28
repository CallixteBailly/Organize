import { pgTable, uuid, varchar, decimal, text, timestamp, index } from "drizzle-orm/pg-core";
import { garages } from "./garages";
import { customers } from "./customers";
import { vehicles } from "./vehicles";
import { users } from "./users";
import { quoteStatusEnum } from "./enums";

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id),
    quoteNumber: varchar("quote_number", { length: 50 }).notNull(),
    status: quoteStatusEnum("status").notNull().default("draft"),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    totalPartsHt: decimal("total_parts_ht", { precision: 10, scale: 2 }).notNull().default("0"),
    totalLaborHt: decimal("total_labor_ht", { precision: 10, scale: 2 }).notNull().default("0"),
    totalHt: decimal("total_ht", { precision: 10, scale: 2 }).notNull().default("0"),
    totalVat: decimal("total_vat", { precision: 10, scale: 2 }).notNull().default("0"),
    totalTtc: decimal("total_ttc", { precision: 10, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    signatureDataUrl: text("signature_data_url"),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    repairOrderId: uuid("repair_order_id"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("quotes_garage_idx").on(table.garageId),
    index("quotes_customer_idx").on(table.customerId),
    index("quotes_status_idx").on(table.garageId, table.status),
  ],
);

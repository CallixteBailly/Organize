import {
  pgTable,
  uuid,
  varchar,
  decimal,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { garages } from "./garages";
import { customers } from "./customers";
import { vehicles } from "./vehicles";
import { users } from "./users";
import { repairOrderStatusEnum } from "./enums";

export const repairOrders = pgTable(
  "repair_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    repairOrderNumber: varchar("repair_order_number", { length: 50 }).notNull(),
    status: repairOrderStatusEnum("status").notNull().default("draft"),
    mileageAtIntake: integer("mileage_at_intake"),
    customerComplaint: text("customer_complaint"),
    diagnosis: text("diagnosis"),
    workPerformed: text("work_performed"),
    totalPartsHt: decimal("total_parts_ht", { precision: 10, scale: 2 }).notNull().default("0"),
    totalLaborHt: decimal("total_labor_ht", { precision: 10, scale: 2 }).notNull().default("0"),
    totalHt: decimal("total_ht", { precision: 10, scale: 2 }).notNull().default("0"),
    totalVat: decimal("total_vat", { precision: 10, scale: 2 }).notNull().default("0"),
    totalTtc: decimal("total_ttc", { precision: 10, scale: 2 }).notNull().default("0"),
    signatureDataUrl: text("signature_data_url"),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    quoteId: uuid("quote_id"),
    invoiceId: uuid("invoice_id"),
    assignedTo: uuid("assigned_to").references(() => users.id),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("repair_orders_garage_idx").on(table.garageId),
    index("repair_orders_customer_idx").on(table.customerId),
    index("repair_orders_vehicle_idx").on(table.vehicleId),
    index("repair_orders_status_idx").on(table.garageId, table.status),
    index("repair_orders_date_idx").on(table.garageId, table.createdAt),
  ],
);

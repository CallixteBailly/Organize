import {
  pgTable,
  uuid,
  varchar,
  decimal,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { garages } from "./garages";
import { customers } from "./customers";
import { repairOrders } from "./repair-orders";
import { users } from "./users";
import { invoiceStatusEnum, documentTypeEnum } from "./enums";

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    garageId: uuid("garage_id")
      .notNull()
      .references(() => garages.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    repairOrderId: uuid("repair_order_id").references(() => repairOrders.id),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    documentType: documentTypeEnum("document_type").notNull().default("invoice"),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull().defaultNow(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    // Customer snapshot (denormalized for legal compliance)
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    customerAddress: text("customer_address").notNull(),
    customerSiret: varchar("customer_siret", { length: 14 }),
    customerVatNumber: varchar("customer_vat_number", { length: 20 }),
    // Totals
    totalHt: decimal("total_ht", { precision: 10, scale: 2 }).notNull().default("0"),
    totalVat: decimal("total_vat", { precision: 10, scale: 2 }).notNull().default("0"),
    totalTtc: decimal("total_ttc", { precision: 10, scale: 2 }).notNull().default("0"),
    amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
    // NF525 compliance
    nf525Hash: text("nf525_hash"),
    nf525PreviousHash: text("nf525_previous_hash"),
    nf525Sequence: integer("nf525_sequence"),
    // Credit note
    creditNoteForId: uuid("credit_note_for_id"),
    // Metadata
    notes: text("notes"),
    paymentTerms: text("payment_terms"),
    pdfUrl: text("pdf_url"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    sentVia: varchar("sent_via", { length: 20 }),
    lastReminderAt: timestamp("last_reminder_at", { withTimezone: true }),
    reminderCount: integer("reminder_count").notNull().default(0),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("invoices_garage_idx").on(table.garageId),
    index("invoices_customer_idx").on(table.customerId),
    index("invoices_status_idx").on(table.garageId, table.status),
    index("invoices_date_idx").on(table.garageId, table.issueDate),
    uniqueIndex("invoices_number_garage_idx").on(table.garageId, table.invoiceNumber),
    index("invoices_nf525_seq_idx").on(table.garageId, table.nf525Sequence),
  ],
);

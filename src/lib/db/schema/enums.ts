import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "manager",
  "mechanic",
  "secretary",
]);

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "entry",
  "exit",
  "adjustment",
  "return",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const repairOrderStatusEnum = pgEnum("repair_order_status", [
  "draft",
  "pending",
  "approved",
  "in_progress",
  "completed",
  "invoiced",
  "cancelled",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "finalized",
  "sent",
  "paid",
  "partially_paid",
  "overdue",
  "cancelled",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "converted",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "bank_transfer",
  "check",
  "online",
]);

export const lineTypeEnum = pgEnum("line_type", ["part", "labor", "other"]);

export const documentTypeEnum = pgEnum("document_type", [
  "invoice",
  "credit_note",
  "quote",
  "repair_order",
]);

import { z } from "zod/v4";

export const createInvoiceSchema = z.object({
  customerId: z.uuid("Client requis"),
  repairOrderId: z.uuid().optional().or(z.literal("")),
  dueDate: z.coerce.date(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
});

export const invoiceLineSchema = z.object({
  invoiceId: z.uuid("Facture requise"),
  type: z.enum(["part", "labor", "other"]),
  stockItemId: z.uuid().optional().or(z.literal("")),
  reference: z.string().optional(),
  description: z.string().min(1, "Description requise"),
  quantity: z.coerce.number().min(0.01, "Quantite requise"),
  unitPrice: z.coerce.number().min(0, "Prix requis"),
  vatRate: z.coerce.number().min(0).max(100).default(20),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.uuid("Facture requise"),
  amount: z.coerce.number().min(0.01, "Montant requis"),
  method: z.enum(["cash", "card", "bank_transfer", "check", "online"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const sendInvoiceSchema = z.object({
  invoiceId: z.uuid(),
  via: z.enum(["email", "sms"]),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

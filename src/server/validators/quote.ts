import { z } from "zod/v4";

export const createQuoteSchema = z.object({
  customerId: z.uuid("Client requis"),
  vehicleId: z.uuid().optional().or(z.literal("")),
  validUntil: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const quoteLineSchema = z.object({
  quoteId: z.uuid("Devis requis"),
  type: z.enum(["part", "labor", "other"]),
  stockItemId: z.uuid().optional().or(z.literal("")),
  reference: z.string().optional(),
  description: z.string().min(1, "Description requise"),
  quantity: z.coerce.number().min(0.01, "Quantite requise"),
  unitPrice: z.coerce.number().min(0, "Prix requis"),
  vatRate: z.coerce.number().min(0).max(100).default(20),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type QuoteLineInput = z.infer<typeof quoteLineSchema>;

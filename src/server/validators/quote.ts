import { z } from "zod/v4";

export const createQuoteSchema = z.object({
  customerId: z.uuid("Client requis"),
  vehicleId: z.uuid().optional().or(z.literal("")),
  validUntil: z.string().optional().transform(v => {
    if (!v || v === "") return undefined;
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }),
  notes: z.string().optional(),
});

export const quoteLineSchema = z.object({
  quoteId: z.uuid("Devis requis"),
  type: z.enum(["part", "labor", "other"]),
  stockItemId: z.uuid().optional().or(z.literal("")),
  reference: z.string().optional(),
  description: z.string().min(1, "Description requise"),
  quantity: z.coerce.number().min(0.01, "Quantite requise").max(999_999, "Quantite maximale depassee"),
  unitPrice: z.coerce.number().min(0, "Prix requis").max(999_999.99, "Prix maximum depasse"),
  vatRate: z.coerce.number().min(0).max(100).default(20),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type QuoteLineInput = z.infer<typeof quoteLineSchema>;

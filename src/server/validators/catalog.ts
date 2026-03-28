import { z } from "zod/v4";

export const plateSearchSchema = z.object({
  plate: z
    .string()
    .min(5, "La plaque doit contenir au moins 5 caractères")
    .max(15, "La plaque ne peut pas dépasser 15 caractères")
    .transform((v) => v.toUpperCase().replace(/[\s-]/g, "")),
});

export const catalogLineSchema = z.object({
  repairOrderId: z.uuid("L'ordre de réparation est requis"),
  description: z.string().min(1, "La description est requise"),
  reference: z.string().optional(),
  brand: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "Le prix doit être positif"),
  quantity: z.coerce.number().min(0.01, "La quantité doit être supérieure à 0").default(1),
  vatRate: z.coerce.number().default(20),
});

export type PlateSearchInput = z.infer<typeof plateSearchSchema>;
export type CatalogLineInput = z.infer<typeof catalogLineSchema>;

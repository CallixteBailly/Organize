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

export const vehicleModelSearchSchema = z.object({
  make: z.string().min(1, "La marque est requise").max(50, "Marque trop longue"),
  model: z.string().min(1, "Le modèle est requis").max(100, "Modèle trop long"),
  year: z.coerce
    .number()
    .int()
    .min(1900, "Année invalide")
    .max(2030, "Année invalide")
    .optional(),
  fuelType: z
    .enum(["Essence", "Diesel", "Hybride", "Électrique", "GPL", "Hydrogène"])
    .optional(),
});

export type PlateSearchInput = z.infer<typeof plateSearchSchema>;
export type CatalogLineInput = z.infer<typeof catalogLineSchema>;
export type VehicleModelSearchInput = z.infer<typeof vehicleModelSearchSchema>;

import { z } from "zod/v4";

export const createGarageSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caracteres"),
  siret: z
    .string()
    .length(14, "Le SIRET doit contenir 14 chiffres")
    .regex(/^\d{14}$/, "Le SIRET ne doit contenir que des chiffres"),
  address: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, "La ville est requise"),
  postalCode: z
    .string()
    .length(5, "Le code postal doit contenir 5 chiffres")
    .regex(/^\d{5}$/, "Code postal invalide"),
  phone: z.string().optional(),
  email: z.email("Email invalide").optional(),
});

export const updateGarageSchema = createGarageSchema.partial().extend({
  vatNumber: z.string().optional(),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  invoicePrefix: z.string().max(10).optional(),
  quotePrefix: z.string().max(10).optional(),
  repairOrderPrefix: z.string().max(10).optional(),
});

export type CreateGarageInput = z.infer<typeof createGarageSchema>;
export type UpdateGarageInput = z.infer<typeof updateGarageSchema>;

import { z } from "zod/v4";

export const createCustomerSchema = z.object({
  type: z.enum(["individual", "company"]).default("individual"),
  firstName: z.string().min(1, "Le prenom est requis").optional(),
  lastName: z.string().min(1, "Le nom est requis").optional(),
  companyName: z.string().optional(),
  siret: z.string().length(14).regex(/^\d{14}$/).optional().or(z.literal("")),
  vatNumber: z.string().optional(),
  email: z.email("Email invalide").optional().or(z.literal("")),
  phone: z.string().min(10, "Telephone invalide").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const searchCustomerSchema = z.object({
  q: z.string().min(1),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

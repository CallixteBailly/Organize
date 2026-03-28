import { z } from "zod/v4";

export const createVehicleSchema = z.object({
  customerId: z.uuid("Client requis"),
  licensePlate: z
    .string()
    .min(1, "L'immatriculation est requise")
    .transform((v) => v.toUpperCase().replace(/[\s-]/g, "")),
  vin: z.string().max(17).optional().or(z.literal("")),
  brand: z.string().min(1, "La marque est requise"),
  model: z.string().min(1, "Le modele est requis"),
  version: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  engineType: z.string().optional(),
  mileage: z.coerce.number().int().min(0).optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial().omit({ customerId: true });

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

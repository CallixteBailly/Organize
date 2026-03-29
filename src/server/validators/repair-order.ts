import { z } from "zod/v4";

export const createRepairOrderSchema = z.object({
  customerId: z.uuid("Client requis"),
  vehicleId: z.uuid("Vehicule requis"),
  mileageAtIntake: z.coerce.number().int().min(0).optional(),
  customerComplaint: z.string().optional(),
  assignedTo: z.uuid().optional().or(z.literal("")),
});

export const updateRepairOrderSchema = z.object({
  diagnosis: z.string().optional(),
  workPerformed: z.string().optional(),
  customerComplaint: z.string().optional(),
  assignedTo: z.uuid().optional().or(z.literal("")),
});

export const repairOrderLineSchema = z.object({
  repairOrderId: z.uuid("OR requis"),
  type: z.enum(["part", "labor", "other"]),
  stockItemId: z.uuid().optional().or(z.literal("")),
  reference: z.string().optional(),
  description: z.string().min(1, "Description requise"),
  quantity: z.coerce.number().min(0.01, "Quantite requise").max(999_999, "Quantite maximale depassee"),
  unitPrice: z.coerce.number().min(0, "Prix requis").max(999_999.99, "Prix maximum depasse"),
  vatRate: z.coerce.number().min(0).max(100).default(20),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
});

export const signatureSchema = z.object({
  signatureDataUrl: z.string()
    .min(1, "Signature requise")
    .max(500_000, "Signature trop volumineuse (max 500 Ko)")
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "Format de signature invalide"),
});

export type CreateRepairOrderInput = z.infer<typeof createRepairOrderSchema>;
export type UpdateRepairOrderInput = z.infer<typeof updateRepairOrderSchema>;
export type RepairOrderLineInput = z.infer<typeof repairOrderLineSchema>;

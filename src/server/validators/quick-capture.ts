import { z } from "zod";

// ── Input utilisateur ──

export const quickCaptureInputSchema = z.object({
  text: z
    .string()
    .min(3, "Le texte doit contenir au moins 3 caractères")
    .max(500, "Le texte ne peut pas dépasser 500 caractères"),
});

// ── Sortie Claude ──

export const quickCaptureParsedSchema = z.object({
  customer: z.object({
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    companyName: z.string().nullish(),
  }),
  vehicle: z.object({
    brand: z.string().nullish(),
    model: z.string().nullish(),
    licensePlate: z.string().nullish(),
    year: z.number().int().min(1900).max(2100).nullish(),
  }),
  service: z.object({
    description: z.string(),
    type: z.enum(["labor", "part", "other"]),
  }),
  amount: z.number().positive().nullish(),
  mileage: z.number().int().nonnegative().nullish(),
  payment: z
    .object({
      method: z.enum(["cash", "card", "bank_transfer", "check", "online"]),
      isPaid: z.boolean(),
    })
    .nullish(),
  confidence: z.number().min(0).max(1),
});

export type QuickCaptureParsed = z.infer<typeof quickCaptureParsedSchema>;

// ── Match existant (client / véhicule trouvé en DB) ──

export interface CustomerMatch {
  id: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
}

export interface VehicleMatch {
  id: string;
  brand: string | null;
  model: string | null;
  licensePlate: string | null;
  customerId: string;
}

// ── Preview (réponse du parse) ──

export interface QuickCapturePreview {
  parsed: QuickCaptureParsed;
  customerMatches: CustomerMatch[];
  vehicleMatches: VehicleMatch[];
  rawText: string;
}

// ── Payload de confirmation ──

export const quickCaptureConfirmSchema = z.object({
  rawText: z.string(),
  // Client : soit existingId, soit données pour en créer un
  customer: z.object({
    existingId: z.string().uuid().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    companyName: z.string().optional(),
  }),
  // Véhicule : soit existingId, soit données pour en créer un
  vehicle: z.object({
    existingId: z.string().uuid().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    licensePlate: z.string().optional(),
    year: z.number().int().optional(),
  }),
  service: z.object({
    description: z.string().min(1, "La description est requise"),
    type: z.enum(["labor", "part", "other"]),
  }),
  amount: z.number().positive().optional(),
  mileage: z.number().int().nonnegative().optional(),
  payment: z
    .object({
      method: z.enum(["cash", "card", "bank_transfer", "check", "online"]),
    })
    .optional(),
  createInvoice: z.boolean(),
});

export type QuickCaptureConfirmInput = z.infer<typeof quickCaptureConfirmSchema>;

// ── Résultat de création ──

export interface QuickCaptureResult {
  customerId: string;
  vehicleId: string;
  repairOrderId: string;
  repairOrderNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

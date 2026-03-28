import { z } from "zod/v4";

export const createStockItemSchema = z.object({
  categoryId: z.uuid().optional().or(z.literal("")),
  reference: z.string().min(1, "La reference est requise"),
  barcode: z.string().optional().or(z.literal("")),
  oemReference: z.string().optional().or(z.literal("")),
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  brand: z.string().optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0, "Le prix de vente est requis"),
  vatRate: z.coerce.number().min(0).max(100).default(20),
  quantity: z.coerce.number().int().min(0).default(0),
  minQuantity: z.coerce.number().int().min(0).default(0),
  maxQuantity: z.coerce.number().int().min(0).optional(),
  location: z.string().optional(),
  unit: z.string().default("piece"),
});

export const updateStockItemSchema = createStockItemSchema.partial();

export const createStockMovementSchema = z.object({
  stockItemId: z.uuid("Article requis"),
  type: z.enum(["entry", "exit", "adjustment", "return"]),
  quantity: z.coerce.number().int().min(1, "Quantite requise"),
  unitPrice: z.coerce.number().min(0).optional(),
  reason: z.string().optional(),
  repairOrderId: z.uuid().optional().or(z.literal("")),
  orderId: z.uuid().optional().or(z.literal("")),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  parentId: z.uuid().optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide")
    .optional()
    .or(z.literal("")),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateStockItemInput = z.infer<typeof createStockItemSchema>;
export type UpdateStockItemInput = z.infer<typeof updateStockItemSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

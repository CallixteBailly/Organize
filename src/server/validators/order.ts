import { z } from "zod/v4";

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  code: z.string().optional().or(z.literal("")),
  contactName: z.string().optional(),
  email: z.email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional(),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
  deliveryDays: z.coerce.number().int().min(0).optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const createOrderSchema = z.object({
  supplierId: z.uuid("Fournisseur requis"),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      stockItemId: z.uuid().optional(),
      reference: z.string().min(1),
      name: z.string().min(1),
      quantity: z.coerce.number().int().min(1),
      unitPrice: z.coerce.number().min(0),
    }),
  ).min(1, "Au moins un article requis"),
});

export const quickOrderSchema = z.object({
  stockItemId: z.uuid("Article requis"),
  supplierId: z.uuid("Fournisseur requis"),
  quantity: z.coerce.number().int().min(1, "Quantite requise"),
});

export const comparePricesSchema = z.object({
  stockItemId: z.uuid("Article requis"),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type QuickOrderInput = z.infer<typeof quickOrderSchema>;

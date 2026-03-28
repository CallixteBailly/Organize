import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { suppliers, supplierCatalog, stockItems } from "@/lib/db/schema";
import type { CreateSupplierInput, UpdateSupplierInput } from "@/server/validators/order";

export async function getSuppliers(garageId: string) {
  return db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.garageId, garageId), eq(suppliers.isActive, true)))
    .orderBy(asc(suppliers.name));
}

export async function getSupplierById(garageId: string, supplierId: string) {
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.garageId, garageId)))
    .limit(1);
  return supplier ?? null;
}

export async function createSupplier(garageId: string, data: CreateSupplierInput) {
  const [supplier] = await db
    .insert(suppliers)
    .values({
      garageId,
      name: data.name,
      code: data.code || null,
      contactName: data.contactName,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address,
      website: data.website || null,
      deliveryDays: data.deliveryDays,
      minOrderAmount: data.minOrderAmount?.toString(),
    })
    .returning();
  return supplier;
}

export async function updateSupplier(
  garageId: string,
  supplierId: string,
  data: UpdateSupplierInput,
) {
  const values: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.minOrderAmount !== undefined) values.minOrderAmount = data.minOrderAmount?.toString();
  if (data.website !== undefined) values.website = data.website || null;
  if (data.email !== undefined) values.email = data.email || null;

  const [updated] = await db
    .update(suppliers)
    .set(values)
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.garageId, garageId)))
    .returning();
  return updated;
}

export async function deactivateSupplier(garageId: string, supplierId: string) {
  const [updated] = await db
    .update(suppliers)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.garageId, garageId)))
    .returning();
  return updated;
}

export async function comparePricesForItem(garageId: string, stockItemId: string) {
  return db
    .select({
      catalogEntry: supplierCatalog,
      supplierName: suppliers.name,
      supplierDeliveryDays: suppliers.deliveryDays,
    })
    .from(supplierCatalog)
    .innerJoin(suppliers, eq(supplierCatalog.supplierId, suppliers.id))
    .where(
      and(
        eq(supplierCatalog.stockItemId, stockItemId),
        eq(supplierCatalog.isAvailable, true),
        eq(suppliers.garageId, garageId),
        eq(suppliers.isActive, true),
      ),
    )
    .orderBy(asc(supplierCatalog.unitPrice));
}

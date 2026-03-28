import { eq, and, or, ilike, lte, sql, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  stockItems,
  stockMovements,
  stockCategories,
  users,
} from "@/lib/db/schema";
import type {
  CreateStockItemInput,
  UpdateStockItemInput,
  CreateStockMovementInput,
  CreateCategoryInput,
} from "@/server/validators/stock";
import type { PaginationInput } from "@/server/validators/common";

// ── Stock Items ──

export async function getStockItems(
  garageId: string,
  pagination: PaginationInput,
  filters?: { categoryId?: string; search?: string; lowStockOnly?: boolean },
) {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const conditions = [eq(stockItems.garageId, garageId), eq(stockItems.isActive, true)];

  if (filters?.categoryId) {
    conditions.push(eq(stockItems.categoryId, filters.categoryId));
  }
  if (filters?.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(stockItems.name, pattern),
        ilike(stockItems.reference, pattern),
        ilike(stockItems.barcode, pattern),
        ilike(stockItems.brand, pattern),
      )!,
    );
  }
  if (filters?.lowStockOnly) {
    conditions.push(lte(stockItems.quantity, stockItems.minQuantity));
  }

  const where = and(...conditions);

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(stockItems)
      .where(where)
      .orderBy(asc(stockItems.name))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(stockItems).where(where),
  ]);

  return {
    items,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getStockItemById(garageId: string, itemId: string) {
  const [item] = await db
    .select()
    .from(stockItems)
    .where(and(eq(stockItems.id, itemId), eq(stockItems.garageId, garageId)))
    .limit(1);
  return item ?? null;
}

export async function getStockItemByBarcode(garageId: string, barcode: string) {
  const [item] = await db
    .select()
    .from(stockItems)
    .where(and(eq(stockItems.garageId, garageId), eq(stockItems.barcode, barcode)))
    .limit(1);
  return item ?? null;
}

export async function createStockItem(garageId: string, data: CreateStockItemInput) {
  const values = {
    ...data,
    garageId,
    categoryId: data.categoryId || null,
    barcode: data.barcode || null,
    oemReference: data.oemReference || null,
    purchasePrice: data.purchasePrice?.toString(),
    sellingPrice: data.sellingPrice.toString(),
    vatRate: data.vatRate.toString(),
  };
  const [item] = await db.insert(stockItems).values(values).returning();
  return item;
}

export async function updateStockItem(
  garageId: string,
  itemId: string,
  data: UpdateStockItemInput,
) {
  const values: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.categoryId !== undefined) values.categoryId = data.categoryId || null;
  if (data.purchasePrice !== undefined) values.purchasePrice = data.purchasePrice?.toString();
  if (data.sellingPrice !== undefined) values.sellingPrice = data.sellingPrice.toString();
  if (data.vatRate !== undefined) values.vatRate = data.vatRate.toString();

  const [updated] = await db
    .update(stockItems)
    .set(values)
    .where(and(eq(stockItems.id, itemId), eq(stockItems.garageId, garageId)))
    .returning();
  return updated;
}

export async function deactivateStockItem(garageId: string, itemId: string) {
  const [updated] = await db
    .update(stockItems)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(stockItems.id, itemId), eq(stockItems.garageId, garageId)))
    .returning();
  return updated;
}

// ── Low Stock Alerts ──

export async function getLowStockAlerts(garageId: string) {
  return db
    .select()
    .from(stockItems)
    .where(
      and(
        eq(stockItems.garageId, garageId),
        eq(stockItems.isActive, true),
        lte(stockItems.quantity, stockItems.minQuantity),
      ),
    )
    .orderBy(asc(stockItems.quantity));
}

// ── Stock Movements ──

export async function getMovementsByItem(garageId: string, stockItemId: string, limit = 50) {
  return db
    .select({
      movement: stockMovements,
      performerFirstName: users.firstName,
      performerLastName: users.lastName,
    })
    .from(stockMovements)
    .innerJoin(users, eq(stockMovements.performedBy, users.id))
    .where(
      and(eq(stockMovements.garageId, garageId), eq(stockMovements.stockItemId, stockItemId)),
    )
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);
}

export async function getRecentMovements(garageId: string, limit = 50) {
  return db
    .select({
      movement: stockMovements,
      itemName: stockItems.name,
      itemReference: stockItems.reference,
      performerFirstName: users.firstName,
      performerLastName: users.lastName,
    })
    .from(stockMovements)
    .innerJoin(stockItems, eq(stockMovements.stockItemId, stockItems.id))
    .innerJoin(users, eq(stockMovements.performedBy, users.id))
    .where(eq(stockMovements.garageId, garageId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);
}

export async function recordStockMovement(
  garageId: string,
  userId: string,
  data: CreateStockMovementInput,
) {
  // Compute signed delta: exit subtracts, everything else adds
  const delta = data.type === "exit" ? -Math.abs(data.quantity) : Math.abs(data.quantity);

  // Record the movement with the same signed delta for audit consistency
  const [movement] = await db
    .insert(stockMovements)
    .values({
      garageId,
      stockItemId: data.stockItemId,
      type: data.type,
      quantity: delta,
      unitPrice: data.unitPrice?.toString(),
      reason: data.reason,
      repairOrderId: data.repairOrderId || null,
      orderId: data.orderId || null,
      performedBy: userId,
    })
    .returning();

  // Update stock quantity with the same delta
  await db
    .update(stockItems)
    .set({
      quantity: sql`${stockItems.quantity} + ${delta}`,
      updatedAt: new Date(),
    })
    .where(and(eq(stockItems.id, data.stockItemId), eq(stockItems.garageId, garageId)));

  return movement;
}

// ── Categories ──

export async function getCategories(garageId: string) {
  return db
    .select()
    .from(stockCategories)
    .where(eq(stockCategories.garageId, garageId))
    .orderBy(asc(stockCategories.name));
}

export async function createCategory(garageId: string, data: CreateCategoryInput) {
  const [category] = await db
    .insert(stockCategories)
    .values({
      garageId,
      name: data.name,
      parentId: data.parentId || null,
      color: data.color || null,
    })
    .returning();
  return category;
}

export async function updateCategory(
  garageId: string,
  categoryId: string,
  data: Partial<CreateCategoryInput>,
) {
  const values: Record<string, unknown> = {};
  if (data.name !== undefined) values.name = data.name;
  if (data.parentId !== undefined) values.parentId = data.parentId || null;
  if (data.color !== undefined) values.color = data.color || null;

  const [updated] = await db
    .update(stockCategories)
    .set(values)
    .where(and(eq(stockCategories.id, categoryId), eq(stockCategories.garageId, garageId)))
    .returning();
  return updated;
}

export async function deleteCategory(garageId: string, categoryId: string) {
  // Unlink items from this category first
  await db
    .update(stockItems)
    .set({ categoryId: null })
    .where(and(eq(stockItems.categoryId, categoryId), eq(stockItems.garageId, garageId)));

  const [deleted] = await db
    .delete(stockCategories)
    .where(and(eq(stockCategories.id, categoryId), eq(stockCategories.garageId, garageId)))
    .returning();
  return deleted;
}

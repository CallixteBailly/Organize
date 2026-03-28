import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  stockItems,
  suppliers,
} from "@/lib/db/schema";
import type { CreateOrderInput, QuickOrderInput } from "@/server/validators/order";
import type { PaginationInput } from "@/server/validators/common";

export async function getOrders(garageId: string, pagination: PaginationInput) {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const [items, countResult] = await Promise.all([
    db
      .select({
        order: orders,
        supplierName: suppliers.name,
      })
      .from(orders)
      .innerJoin(suppliers, eq(orders.supplierId, suppliers.id))
      .where(eq(orders.garageId, garageId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.garageId, garageId)),
  ]);

  return {
    items,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getOrderById(garageId: string, orderId: string) {
  const [order] = await db
    .select({
      order: orders,
      supplierName: suppliers.name,
    })
    .from(orders)
    .innerJoin(suppliers, eq(orders.supplierId, suppliers.id))
    .where(and(eq(orders.id, orderId), eq(orders.garageId, garageId)))
    .limit(1);
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { ...order, items };
}

export async function createOrder(garageId: string, userId: string, data: CreateOrderInput) {
  return db.transaction(async (tx: any) => {
    const totalHt = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const orderNumber = `CMD-${Date.now().toString(36).toUpperCase()}`;

    const [order] = await tx
      .insert(orders)
      .values({
        garageId,
        supplierId: data.supplierId,
        orderNumber,
        status: "pending",
        totalHt: totalHt.toFixed(2),
        totalTtc: (totalHt * 1.2).toFixed(2),
        notes: data.notes,
        orderedBy: userId,
      })
      .returning();

    const itemValues = data.items.map((item) => ({
      orderId: order.id,
      stockItemId: item.stockItemId || null,
      reference: item.reference,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      totalPrice: (item.quantity * item.unitPrice).toFixed(2),
    }));

    await tx.insert(orderItems).values(itemValues);

    return order;
  });
}

export async function quickOrder(garageId: string, userId: string, data: QuickOrderInput) {
  const [item] = await db
    .select()
    .from(stockItems)
    .where(and(eq(stockItems.id, data.stockItemId), eq(stockItems.garageId, garageId)))
    .limit(1);

  if (!item) throw new Error("Article non trouve");

  return createOrder(garageId, userId, {
    supplierId: data.supplierId,
    items: [
      {
        stockItemId: data.stockItemId,
        reference: item.reference,
        name: item.name,
        quantity: data.quantity,
        unitPrice: Number(item.purchasePrice ?? item.sellingPrice),
      },
    ],
  });
}

export async function updateOrderStatus(
  garageId: string,
  orderId: string,
  status: "confirmed" | "shipped" | "delivered" | "cancelled",
) {
  const updates: Record<string, unknown> = { status, updatedAt: new Date() };
  if (status === "delivered") updates.deliveredAt = new Date();

  const [updated] = await db
    .update(orders)
    .set(updates)
    .where(and(eq(orders.id, orderId), eq(orders.garageId, garageId)))
    .returning();
  return updated;
}

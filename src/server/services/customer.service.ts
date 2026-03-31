import { eq, and, or, ilike, inArray, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, vehicles, repairOrders, invoices } from "@/lib/db/schema";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/server/validators/customer";
import type { PaginationInput } from "@/server/validators/common";

export async function getCustomers(garageId: string, pagination: PaginationInput) {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(eq(customers.garageId, garageId))
      .orderBy(desc(customers.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.garageId, garageId)),
  ]);

  return {
    items,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function searchCustomers(garageId: string, query: string) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  const conditions = words.flatMap((word) => {
    const pattern = `%${word}%`;
    return [
      ilike(customers.firstName, pattern),
      ilike(customers.lastName, pattern),
      ilike(customers.companyName, pattern),
      ilike(customers.phone, pattern),
      ilike(customers.email, pattern),
    ];
  });
  return db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.garageId, garageId),
        or(...conditions),
      ),
    )
    .limit(20);
}

export async function getCustomerById(garageId: string, customerId: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.garageId, garageId)))
    .limit(1);
  return customer ?? null;
}

export async function getCustomerWithVehicles(garageId: string, customerId: string) {
  const customer = await getCustomerById(garageId, customerId);
  if (!customer) return null;

  const customerVehicles = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.customerId, customerId), eq(vehicles.garageId, garageId)))
    .orderBy(desc(vehicles.updatedAt));

  return { ...customer, vehicles: customerVehicles };
}

export async function getCustomerStats(garageId: string, customerId: string) {
  const [roCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(repairOrders)
    .where(and(eq(repairOrders.customerId, customerId), eq(repairOrders.garageId, garageId)));

  const [invoiceStats] = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${invoices.totalTtc}::numeric), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.customerId, customerId),
        eq(invoices.garageId, garageId),
        inArray(invoices.status, ["finalized", "sent", "paid", "partially_paid", "overdue"]),
      ),
    );

  return {
    repairOrderCount: Number(roCount.count),
    invoiceCount: Number(invoiceStats.count),
    totalSpent: Number(invoiceStats.total),
  };
}

export async function createCustomer(garageId: string, data: CreateCustomerInput) {
  const [customer] = await db
    .insert(customers)
    .values({ ...data, garageId })
    .returning();
  return customer;
}

export async function updateCustomer(
  garageId: string,
  customerId: string,
  data: UpdateCustomerInput,
) {
  const [updated] = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(customers.id, customerId), eq(customers.garageId, garageId)))
    .returning();
  return updated;
}

export async function deleteCustomer(garageId: string, customerId: string) {
  const [deleted] = await db
    .delete(customers)
    .where(and(eq(customers.id, customerId), eq(customers.garageId, garageId)))
    .returning();
  return deleted;
}

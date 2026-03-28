import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  repairOrders,
  repairOrderLines,
  stockItems,
  stockMovements,
  customers,
  vehicles,
  garages,
  users,
} from "@/lib/db/schema";
import type {
  CreateRepairOrderInput,
  UpdateRepairOrderInput,
  RepairOrderLineInput,
} from "@/server/validators/repair-order";
import type { PaginationInput } from "@/server/validators/common";

export async function getRepairOrders(garageId: string, pagination: PaginationInput) {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const [items, countResult] = await Promise.all([
    db
      .select({
        repairOrder: repairOrders,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        customerCompanyName: customers.companyName,
        vehicleBrand: vehicles.brand,
        vehicleModel: vehicles.model,
        vehiclePlate: vehicles.licensePlate,
      })
      .from(repairOrders)
      .innerJoin(customers, eq(repairOrders.customerId, customers.id))
      .innerJoin(vehicles, eq(repairOrders.vehicleId, vehicles.id))
      .where(eq(repairOrders.garageId, garageId))
      .orderBy(desc(repairOrders.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(repairOrders)
      .where(eq(repairOrders.garageId, garageId)),
  ]);

  return {
    items,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getRepairOrderById(garageId: string, roId: string) {
  const [ro] = await db
    .select({
      repairOrder: repairOrders,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      customerCompanyName: customers.companyName,
      vehicleBrand: vehicles.brand,
      vehicleModel: vehicles.model,
      vehiclePlate: vehicles.licensePlate,
    })
    .from(repairOrders)
    .innerJoin(customers, eq(repairOrders.customerId, customers.id))
    .innerJoin(vehicles, eq(repairOrders.vehicleId, vehicles.id))
    .where(and(eq(repairOrders.id, roId), eq(repairOrders.garageId, garageId)))
    .limit(1);

  if (!ro) return null;

  const lines = await db
    .select()
    .from(repairOrderLines)
    .where(eq(repairOrderLines.repairOrderId, roId))
    .orderBy(repairOrderLines.sortOrder);

  return { ...ro, lines };
}

export async function createRepairOrder(
  garageId: string,
  userId: string,
  data: CreateRepairOrderInput,
) {
  // Get next number
  const [garage] = await db.select().from(garages).where(eq(garages.id, garageId)).limit(1);
  const prefix = garage?.repairOrderPrefix ?? "OR";
  const nextNum = garage?.nextRepairOrderNumber ?? 1;
  const roNumber = `${prefix}-${String(nextNum).padStart(5, "0")}`;

  return db.transaction(async (tx: any) => {
    const [ro] = await tx
      .insert(repairOrders)
      .values({
        garageId,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        repairOrderNumber: roNumber,
        mileageAtIntake: data.mileageAtIntake,
        customerComplaint: data.customerComplaint,
        assignedTo: data.assignedTo || null,
        createdBy: userId,
      })
      .returning();

    await tx
      .update(garages)
      .set({ nextRepairOrderNumber: nextNum + 1 })
      .where(eq(garages.id, garageId));

    return ro;
  });
}

export async function updateRepairOrder(
  garageId: string,
  roId: string,
  data: UpdateRepairOrderInput,
) {
  const values: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.assignedTo !== undefined) values.assignedTo = data.assignedTo || null;

  const [updated] = await db
    .update(repairOrders)
    .set(values)
    .where(and(eq(repairOrders.id, roId), eq(repairOrders.garageId, garageId)))
    .returning();
  return updated;
}

export async function addRepairOrderLine(garageId: string, data: RepairOrderLineInput) {
  const qty = Number(data.quantity);
  const price = Number(data.unitPrice);
  const discount = Number(data.discountPercent);
  const totalHt = qty * price * (1 - discount / 100);

  const [line] = await db
    .insert(repairOrderLines)
    .values({
      repairOrderId: data.repairOrderId,
      type: data.type,
      stockItemId: data.stockItemId || null,
      reference: data.reference,
      description: data.description,
      quantity: data.quantity.toString(),
      unitPrice: data.unitPrice.toString(),
      vatRate: data.vatRate.toString(),
      discountPercent: data.discountPercent.toString(),
      totalHt: totalHt.toFixed(2),
    })
    .returning();

  // Recalculate totals
  await recalculateRepairOrderTotals(data.repairOrderId, garageId);

  return line;
}

export async function removeRepairOrderLine(lineId: string, repairOrderId: string, garageId: string) {
  await db.delete(repairOrderLines).where(eq(repairOrderLines.id, lineId));
  await recalculateRepairOrderTotals(repairOrderId, garageId);
}

async function recalculateRepairOrderTotals(roId: string, garageId: string) {
  const lines = await db
    .select()
    .from(repairOrderLines)
    .where(eq(repairOrderLines.repairOrderId, roId));

  let totalPartsHt = 0;
  let totalLaborHt = 0;
  let totalVat = 0;

  for (const line of lines) {
    const ht = Number(line.totalHt);
    const vat = ht * (Number(line.vatRate) / 100);
    if (line.type === "part") totalPartsHt += ht;
    else totalLaborHt += ht;
    totalVat += vat;
  }

  const totalHt = totalPartsHt + totalLaborHt;
  const totalTtc = totalHt + totalVat;

  await db
    .update(repairOrders)
    .set({
      totalPartsHt: totalPartsHt.toFixed(2),
      totalLaborHt: totalLaborHt.toFixed(2),
      totalHt: totalHt.toFixed(2),
      totalVat: totalVat.toFixed(2),
      totalTtc: totalTtc.toFixed(2),
      updatedAt: new Date(),
    })
    .where(and(eq(repairOrders.id, roId), eq(repairOrders.garageId, garageId)));
}

export async function recordSignature(garageId: string, roId: string, signatureDataUrl: string) {
  const [updated] = await db
    .update(repairOrders)
    .set({ signatureDataUrl, signedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(repairOrders.id, roId), eq(repairOrders.garageId, garageId)))
    .returning();
  return updated;
}

export async function closeRepairOrder(garageId: string, roId: string, userId: string) {
  return db.transaction(async (tx: any) => {
    // Get the repair order with lines
    const [ro] = await tx
      .select()
      .from(repairOrders)
      .where(and(eq(repairOrders.id, roId), eq(repairOrders.garageId, garageId)))
      .limit(1);

    if (!ro) throw new Error("OR non trouve");
    if (ro.status === "invoiced") throw new Error("OR deja facture");

    const lines = await tx
      .select()
      .from(repairOrderLines)
      .where(eq(repairOrderLines.repairOrderId, roId));

    // Deduct stock for part lines
    for (const line of lines) {
      if (line.type === "part" && line.stockItemId) {
        const qty = Math.abs(Number(line.quantity));

        await tx.insert(stockMovements).values({
          garageId,
          stockItemId: line.stockItemId,
          type: "exit",
          quantity: -qty,
          unitPrice: line.unitPrice,
          reason: `OR ${ro.repairOrderNumber}`,
          repairOrderId: roId,
          performedBy: userId,
        });

        await tx
          .update(stockItems)
          .set({
            quantity: sql`${stockItems.quantity} - ${qty}`,
            updatedAt: new Date(),
          })
          .where(eq(stockItems.id, line.stockItemId));
      }
    }

    // Update status
    const [updated] = await tx
      .update(repairOrders)
      .set({
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(repairOrders.id, roId))
      .returning();

    return updated;
  });
}

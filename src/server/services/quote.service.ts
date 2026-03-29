import { eq, and, sql, desc } from "drizzle-orm";
import { db, type Transaction } from "@/lib/db";
import {
  quotes,
  quoteLines,
  customers,
  vehicles,
  garages,
  repairOrders,
} from "@/lib/db/schema";
import type { CreateQuoteInput, QuoteLineInput } from "@/server/validators/quote";
import type { PaginationInput } from "@/server/validators/common";

export async function getQuotes(garageId: string, pagination: PaginationInput) {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const [items, countResult] = await Promise.all([
    db
      .select({
        quote: quotes,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        customerCompanyName: customers.companyName,
      })
      .from(quotes)
      .innerJoin(customers, eq(quotes.customerId, customers.id))
      .where(eq(quotes.garageId, garageId))
      .orderBy(desc(quotes.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(eq(quotes.garageId, garageId)),
  ]);

  return {
    items,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getQuoteById(garageId: string, quoteId: string) {
  const [q] = await db
    .select({
      quote: quotes,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      customerCompanyName: customers.companyName,
    })
    .from(quotes)
    .innerJoin(customers, eq(quotes.customerId, customers.id))
    .where(and(eq(quotes.id, quoteId), eq(quotes.garageId, garageId)))
    .limit(1);

  if (!q) return null;

  const lines = await db
    .select()
    .from(quoteLines)
    .where(eq(quoteLines.quoteId, quoteId))
    .orderBy(quoteLines.sortOrder);

  return { ...q, lines };
}

export async function createQuote(garageId: string, userId: string, data: CreateQuoteInput) {
  const [garage] = await db.select().from(garages).where(eq(garages.id, garageId)).limit(1);
  const prefix = garage?.quotePrefix ?? "DE";
  const nextNum = garage?.nextQuoteNumber ?? 1;
  const quoteNumber = `${prefix}-${String(nextNum).padStart(5, "0")}`;

  return db.transaction(async (tx: Transaction) => {
    const [quote] = await tx
      .insert(quotes)
      .values({
        garageId,
        customerId: data.customerId,
        vehicleId: data.vehicleId || null,
        quoteNumber,
        validUntil: data.validUntil,
        notes: data.notes,
        createdBy: userId,
      })
      .returning();

    await tx
      .update(garages)
      .set({ nextQuoteNumber: nextNum + 1 })
      .where(eq(garages.id, garageId));

    return quote;
  });
}

export async function addQuoteLine(garageId: string, data: QuoteLineInput) {
  const qty = Number(data.quantity);
  const price = Number(data.unitPrice);
  const discount = Number(data.discountPercent);
  const totalHt = qty * price * (1 - discount / 100);

  const [line] = await db
    .insert(quoteLines)
    .values({
      quoteId: data.quoteId,
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

  await recalculateQuoteTotals(data.quoteId, garageId);
  return line;
}

export async function removeQuoteLine(lineId: string, quoteId: string, garageId: string) {
  await db.delete(quoteLines).where(and(eq(quoteLines.id, lineId), eq(quoteLines.quoteId, quoteId)));
  await recalculateQuoteTotals(quoteId, garageId);
}

async function recalculateQuoteTotals(quoteId: string, garageId: string) {
  const lines = await db
    .select()
    .from(quoteLines)
    .where(eq(quoteLines.quoteId, quoteId));

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
    .update(quotes)
    .set({
      totalPartsHt: totalPartsHt.toFixed(2),
      totalLaborHt: totalLaborHt.toFixed(2),
      totalHt: totalHt.toFixed(2),
      totalVat: totalVat.toFixed(2),
      totalTtc: totalTtc.toFixed(2),
      updatedAt: new Date(),
    })
    .where(and(eq(quotes.id, quoteId), eq(quotes.garageId, garageId)));
}

export async function convertQuoteToRepairOrder(
  garageId: string,
  quoteId: string,
  userId: string,
) {
  const quoteData = await getQuoteById(garageId, quoteId);
  if (!quoteData) throw new Error("Devis non trouve");

  const [garage] = await db.select().from(garages).where(eq(garages.id, garageId)).limit(1);
  const prefix = garage?.repairOrderPrefix ?? "OR";
  const nextNum = garage?.nextRepairOrderNumber ?? 1;
  const roNumber = `${prefix}-${String(nextNum).padStart(5, "0")}`;

  return db.transaction(async (tx: Transaction) => {
    // Create repair order
    const [ro] = await tx
      .insert(repairOrders)
      .values({
        garageId,
        customerId: quoteData.quote.customerId,
        vehicleId: quoteData.quote.vehicleId!,
        repairOrderNumber: roNumber,
        quoteId,
        totalPartsHt: quoteData.quote.totalPartsHt,
        totalLaborHt: quoteData.quote.totalLaborHt,
        totalHt: quoteData.quote.totalHt,
        totalVat: quoteData.quote.totalVat,
        totalTtc: quoteData.quote.totalTtc,
        createdBy: userId,
      })
      .returning();

    // Copy lines
    if (quoteData.lines.length > 0) {
      const lineValues = quoteData.lines.map((l) => ({
        repairOrderId: ro.id,
        type: l.type,
        stockItemId: l.stockItemId,
        reference: l.reference,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        vatRate: l.vatRate,
        discountPercent: l.discountPercent,
        totalHt: l.totalHt,
        sortOrder: l.sortOrder,
      }));
      // Import repairOrderLines in the transaction
      const { repairOrderLines: roLines } = await import("@/lib/db/schema");
      await tx.insert(roLines).values(lineValues);
    }

    // Update quote status
    await tx
      .update(quotes)
      .set({ status: "converted", repairOrderId: ro.id, updatedAt: new Date() })
      .where(eq(quotes.id, quoteId));

    // Increment OR number
    await tx
      .update(garages)
      .set({ nextRepairOrderNumber: nextNum + 1 })
      .where(eq(garages.id, garageId));

    return ro;
  });
}

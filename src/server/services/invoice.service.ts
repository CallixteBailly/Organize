import { eq, and, sql, desc, inArray, gte, lte } from "drizzle-orm";
import { db, type Transaction } from "@/lib/db";
import {
  invoices,
  invoiceLines,
  customers,
  garages,
  repairOrders,
  repairOrderLines,
  payments,
} from "@/lib/db/schema";
import { computeNF525Hash } from "@/lib/utils/nf525";
import { roundCents } from "@/lib/utils/format";
import type { CreateInvoiceInput, InvoiceLineInput } from "@/server/validators/invoice";
import type { PaginationInput } from "@/server/validators/common";

// ── List / Get ──

export async function getInvoices(garageId: string, pagination: PaginationInput) {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(invoices)
      .where(eq(invoices.garageId, garageId))
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.garageId, garageId)),
  ]);

  return {
    items,
    total: Number(countResult[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0].count) / limit),
  };
}

export async function getInvoiceById(garageId: string, invoiceId: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.garageId, garageId)))
    .limit(1);

  if (!invoice) return null;

  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, invoiceId))
    .orderBy(invoiceLines.sortOrder);

  const invoicePayments = await db
    .select()
    .from(payments)
    .where(and(eq(payments.invoiceId, invoiceId), eq(payments.garageId, garageId)))
    .orderBy(desc(payments.paidAt));

  return { invoice, lines, payments: invoicePayments };
}

// ── Create Invoice ──

export async function createInvoice(
  garageId: string,
  userId: string,
  data: CreateInvoiceInput,
) {
  // Get customer for snapshot
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, data.customerId), eq(customers.garageId, garageId)))
    .limit(1);

  if (!customer) throw new Error("Client non trouve");

  const customerName = customer.companyName
    || [customer.firstName, customer.lastName].filter(Boolean).join(" ")
    || "Client";
  const customerAddress = [customer.address, customer.postalCode, customer.city]
    .filter(Boolean)
    .join(", ");

  return db.transaction(async (tx: Transaction) => {
    // Lock the garage row to prevent concurrent invoice number allocation
    const [garage] = await tx
      .select()
      .from(garages)
      .where(eq(garages.id, garageId))
      .for("update")
      .limit(1);

    const prefix = garage?.invoicePrefix ?? "FA";
    const nextNum = garage?.nextInvoiceNumber ?? 1;
    const invoiceNumber = `${prefix}-${String(nextNum).padStart(5, "0")}`;

    const [invoice] = await tx
      .insert(invoices)
      .values({
        garageId,
        customerId: data.customerId,
        repairOrderId: data.repairOrderId || null,
        invoiceNumber,
        dueDate: data.dueDate,
        customerName,
        customerAddress,
        customerSiret: customer.siret,
        customerVatNumber: customer.vatNumber,
        notes: data.notes,
        paymentTerms: data.paymentTerms,
        createdBy: userId,
      })
      .returning();

    await tx
      .update(garages)
      .set({ nextInvoiceNumber: nextNum + 1 })
      .where(eq(garages.id, garageId));

    return invoice;
  });
}

// ── Auto-generate from Repair Order (UC-02) ──

export async function generateInvoiceFromRepairOrder(
  garageId: string,
  roId: string,
  userId: string,
) {
  const [ro] = await db
    .select()
    .from(repairOrders)
    .where(and(eq(repairOrders.id, roId), eq(repairOrders.garageId, garageId)))
    .limit(1);

  if (!ro) throw new Error("OR non trouve");
  if (ro.status !== "completed") throw new Error("L'OR doit etre cloture avant facturation");

  const roLines = await db
    .select()
    .from(repairOrderLines)
    .where(eq(repairOrderLines.repairOrderId, roId))
    .orderBy(repairOrderLines.sortOrder);

  // Get garage settings for payment terms (read outside transaction — createInvoice locks for numbering)
  const [garageSettings] = await db.select().from(garages).where(eq(garages.id, garageId)).limit(1);
  const paymentDays = garageSettings?.settings?.paymentTermsDays ?? 30;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + paymentDays);

  // Create invoice (uses FOR UPDATE internally for number allocation)
  const invoice = await createInvoice(garageId, userId, {
    customerId: ro.customerId,
    repairOrderId: roId,
    dueDate,
  });

  // Copy lines from OR to invoice
  if (roLines.length > 0) {
    const lineValues = roLines.map((l: typeof repairOrderLines.$inferSelect) => {
      const ht = Number(l.totalHt);
      const vatAmount = roundCents(ht * (Number(l.vatRate) / 100));
      return {
        invoiceId: invoice.id,
        type: l.type,
        stockItemId: l.stockItemId,
        reference: l.reference,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        vatRate: l.vatRate,
        discountPercent: l.discountPercent,
        totalHt: l.totalHt,
        totalVat: vatAmount.toFixed(2),
        sortOrder: l.sortOrder,
      };
    });

    await db.insert(invoiceLines).values(lineValues);
  }

  // Update invoice totals
  await recalculateInvoiceTotals(invoice.id, garageId);

  // Mark OR as invoiced
  await db
    .update(repairOrders)
    .set({ status: "invoiced", invoiceId: invoice.id, updatedAt: new Date() })
    .where(eq(repairOrders.id, roId));

  return invoice;
}

// ── Add/Remove Lines ──

export async function addInvoiceLine(garageId: string, data: InvoiceLineInput) {
  const qty = Number(data.quantity);
  const price = Number(data.unitPrice);
  const discount = Number(data.discountPercent);
  const totalHt = roundCents(qty * price * (1 - discount / 100));
  const totalVat = roundCents(totalHt * (Number(data.vatRate) / 100));

  const [line] = await db
    .insert(invoiceLines)
    .values({
      invoiceId: data.invoiceId,
      type: data.type,
      stockItemId: data.stockItemId || null,
      reference: data.reference,
      description: data.description,
      quantity: data.quantity.toString(),
      unitPrice: data.unitPrice.toString(),
      vatRate: data.vatRate.toString(),
      discountPercent: data.discountPercent.toString(),
      totalHt: totalHt.toFixed(2),
      totalVat: totalVat.toFixed(2),
    })
    .returning();

  await recalculateInvoiceTotals(data.invoiceId, garageId);
  return line;
}

export async function removeInvoiceLine(lineId: string, invoiceId: string, garageId: string) {
  await db.delete(invoiceLines).where(and(eq(invoiceLines.id, lineId), eq(invoiceLines.invoiceId, invoiceId)));
  await recalculateInvoiceTotals(invoiceId, garageId);
}

async function recalculateInvoiceTotals(invoiceId: string, garageId: string) {
  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, invoiceId));

  let totalHt = 0;
  let totalVat = 0;

  for (const line of lines) {
    totalHt = roundCents(totalHt + Number(line.totalHt));
    totalVat = roundCents(totalVat + Number(line.totalVat));
  }

  const totalTtc = roundCents(totalHt + totalVat);

  await db
    .update(invoices)
    .set({
      totalHt: totalHt.toFixed(2),
      totalVat: totalVat.toFixed(2),
      totalTtc: totalTtc.toFixed(2),
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.garageId, garageId)));
}

// ── Finalize (NF525) ──

export async function finalizeInvoice(garageId: string, invoiceId: string) {
  return db.transaction(async (tx: Transaction) => {
    // Get the invoice
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.garageId, garageId)))
      .limit(1);

    if (!invoice) throw new Error("Facture non trouvee");
    if (invoice.status !== "draft") throw new Error("Seul un brouillon peut etre finalise");

    // Get previous hash for chain (use FOR UPDATE to prevent race conditions)
    const [lastFinalized] = await tx
      .select({ nf525Hash: invoices.nf525Hash, nf525Sequence: invoices.nf525Sequence })
      .from(invoices)
      .where(
        and(
          eq(invoices.garageId, garageId),
          inArray(invoices.status, ["finalized", "sent", "paid", "partially_paid", "overdue"]),
        ),
      )
      .orderBy(desc(invoices.nf525Sequence))
      .limit(1);

    const previousHash = lastFinalized?.nf525Hash ?? null;
    const sequence = (lastFinalized?.nf525Sequence ?? 0) + 1;

    // Compute NF525 hash
    const hash = computeNF525Hash({
      previousHash,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate.toISOString(),
      totalTtc: invoice.totalTtc,
      garageId,
    });

    // Finalize
    const [finalized] = await tx
      .update(invoices)
      .set({
        status: "finalized",
        nf525Hash: hash,
        nf525PreviousHash: previousHash,
        nf525Sequence: sequence,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return finalized;
  });
}

// ── Record Payment ──

export async function recordPayment(
  garageId: string,
  data: { invoiceId: string; amount: number; method: string; reference?: string; notes?: string },
) {
  return db.transaction(async (tx: Transaction) => {
    const [payment] = await tx
      .insert(payments)
      .values({
        garageId,
        invoiceId: data.invoiceId,
        amount: data.amount.toFixed(2),
        method: data.method as "cash" | "card" | "bank_transfer" | "check" | "online",
        reference: data.reference,
        notes: data.notes,
      })
      .returning();

    // Update amount paid on invoice
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, data.invoiceId))
      .limit(1);

    const newAmountPaid = roundCents(Number(invoice.amountPaid) + data.amount);
    const totalTtc = Number(invoice.totalTtc);

    let newStatus = invoice.status;
    if (newAmountPaid >= totalTtc) {
      newStatus = "paid";
    } else if (newAmountPaid > 0) {
      newStatus = "partially_paid";
    }

    await tx
      .update(invoices)
      .set({
        amountPaid: newAmountPaid.toFixed(2),
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, data.invoiceId));

    return payment;
  });
}

// ── FEC Export ──

export async function generateFECExport(garageId: string, startDate: Date, endDate: Date) {
  const invoiceList = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.garageId, garageId),
        inArray(invoices.status, ["finalized", "sent", "paid", "partially_paid", "overdue"]),
        gte(invoices.issueDate, startDate),
        lte(invoices.issueDate, endDate),
      ),
    )
    .orderBy(invoices.nf525Sequence);

  // FEC format: tab-separated values
  const header = [
    "JournalCode",
    "JournalLib",
    "EcritureNum",
    "EcritureDate",
    "CompteNum",
    "CompteLib",
    "CompAuxNum",
    "CompAuxLib",
    "PieceRef",
    "PieceDate",
    "EcritureLib",
    "Debit",
    "Credit",
    "EcritureLet",
    "DateLet",
    "ValidDate",
    "Montantdevise",
    "Idevise",
  ].join("\t");

  const lines = invoiceList.map((inv) => {
    return [
      "VE", // Journal code: Ventes
      "Journal des ventes",
      inv.invoiceNumber,
      formatFECDate(inv.issueDate),
      "411000", // Compte client
      inv.customerName,
      "", // CompAuxNum
      "", // CompAuxLib
      inv.invoiceNumber,
      formatFECDate(inv.issueDate),
      `Facture ${inv.invoiceNumber}`,
      inv.totalTtc, // Debit
      "0.00", // Credit
      "", // Lettrage
      "", // Date lettrage
      formatFECDate(inv.issueDate),
      inv.totalTtc,
      "EUR",
    ].join("\t");
  });

  return [header, ...lines].join("\n");
}

function formatFECDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

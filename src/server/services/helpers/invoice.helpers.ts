/**
 * Pure computation functions extracted from invoice.service.ts
 * for unit testing without database dependency.
 */

// ── Line Totals ──

export interface LineInput {
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  vatRate: number;
}

export interface LineTotal {
  totalHt: string;
  totalVat: string;
}

export function computeLineTotal(line: LineInput): LineTotal {
  const totalHt = line.quantity * line.unitPrice * (1 - line.discountPercent / 100);
  const totalVat = totalHt * (line.vatRate / 100);
  return {
    totalHt: totalHt.toFixed(2),
    totalVat: totalVat.toFixed(2),
  };
}

// ── Invoice Totals ──

export interface InvoiceLineRow {
  totalHt: string;
  totalVat: string;
}

export interface InvoiceTotals {
  totalHt: string;
  totalVat: string;
  totalTtc: string;
}

export function computeInvoiceTotals(lines: InvoiceLineRow[]): InvoiceTotals {
  let totalHt = 0;
  let totalVat = 0;

  for (const line of lines) {
    totalHt += Number(line.totalHt);
    totalVat += Number(line.totalVat);
  }

  const totalTtc = totalHt + totalVat;

  return {
    totalHt: totalHt.toFixed(2),
    totalVat: totalVat.toFixed(2),
    totalTtc: totalTtc.toFixed(2),
  };
}

// ── Payment Status ──

export type InvoiceStatus =
  | "draft"
  | "finalized"
  | "sent"
  | "paid"
  | "partially_paid"
  | "overdue";

export function computePaymentStatus(
  currentStatus: InvoiceStatus,
  currentAmountPaid: number,
  paymentAmount: number,
  totalTtc: number,
): { newStatus: InvoiceStatus; newAmountPaid: string } {
  const newAmountPaid = currentAmountPaid + paymentAmount;

  let newStatus: InvoiceStatus = currentStatus;
  if (newAmountPaid >= totalTtc) {
    newStatus = "paid";
  } else if (newAmountPaid > 0) {
    newStatus = "partially_paid";
  }

  return { newStatus, newAmountPaid: newAmountPaid.toFixed(2) };
}

// ── FEC Export ──

export function formatFECDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export interface FECInvoice {
  invoiceNumber: string;
  issueDate: Date;
  customerName: string;
  totalTtc: string;
}

export function formatFECLine(inv: FECInvoice): string {
  return [
    "VE",
    "Journal des ventes",
    inv.invoiceNumber,
    formatFECDate(inv.issueDate),
    "411000",
    inv.customerName,
    "",
    "",
    inv.invoiceNumber,
    formatFECDate(inv.issueDate),
    `Facture ${inv.invoiceNumber}`,
    inv.totalTtc,
    "0.00",
    "",
    "",
    formatFECDate(inv.issueDate),
    inv.totalTtc,
    "EUR",
  ].join("\t");
}

export const FEC_HEADER = [
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

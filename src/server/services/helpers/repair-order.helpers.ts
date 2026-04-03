/**
 * Pure computation functions extracted from repair-order.service.ts
 * for unit testing without database dependency.
 */

// ── Line Totals ──

export interface ROLineInput {
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export function computeROLineTotal(line: ROLineInput): string {
  const totalHt = line.quantity * line.unitPrice * (1 - line.discountPercent / 100);
  return totalHt.toFixed(2);
}

// ── Repair Order Totals ──

export interface ROLineRow {
  type: "part" | "labor" | "other";
  totalHt: string;
  vatRate: string;
}

export interface ROTotals {
  totalPartsHt: string;
  totalLaborHt: string;
  totalHt: string;
  totalVat: string;
  totalTtc: string;
}

export function computeROTotals(lines: ROLineRow[]): ROTotals {
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

  return {
    totalPartsHt: totalPartsHt.toFixed(2),
    totalLaborHt: totalLaborHt.toFixed(2),
    totalHt: totalHt.toFixed(2),
    totalVat: totalVat.toFixed(2),
    totalTtc: totalTtc.toFixed(2),
  };
}

// ── Stock Deduction Logic ──

export interface ROLineForClose {
  type: "part" | "labor" | "other";
  stockItemId: string | null;
  quantity: string;
  unitPrice: string;
}

export interface StockDeduction {
  stockItemId: string;
  quantity: number;
  unitPrice: string;
}

export function computeStockDeductions(lines: ROLineForClose[]): StockDeduction[] {
  return lines
    .filter((line): line is ROLineForClose & { stockItemId: string } =>
      line.type === "part" && line.stockItemId !== null,
    )
    .map((line) => ({
      stockItemId: line.stockItemId,
      quantity: Math.abs(Number(line.quantity)),
      unitPrice: line.unitPrice,
    }));
}

// ── Auto-numbering ──

export function formatDocumentNumber(prefix: string, nextNum: number): string {
  return `${prefix}-${String(nextNum).padStart(5, "0")}`;
}

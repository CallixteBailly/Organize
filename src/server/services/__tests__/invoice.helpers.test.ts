import { describe, it, expect } from "vitest";
import {
  computeLineTotal,
  computeInvoiceTotals,
  computePaymentStatus,
  formatFECDate,
  formatFECLine,
  FEC_HEADER,
} from "../helpers/invoice.helpers";

describe("Invoice helpers", () => {
  // ── computeLineTotal ──

  describe("computeLineTotal", () => {
    it("computes HT and VAT for a simple line", () => {
      const result = computeLineTotal({
        quantity: 2,
        unitPrice: 50,
        discountPercent: 0,
        vatRate: 20,
      });
      expect(result.totalHt).toBe("100.00");
      expect(result.totalVat).toBe("20.00");
    });

    it("applies discount correctly", () => {
      const result = computeLineTotal({
        quantity: 1,
        unitPrice: 100,
        discountPercent: 10,
        vatRate: 20,
      });
      // 100 * (1 - 10/100) = 90 HT, 90 * 0.20 = 18 VAT
      expect(result.totalHt).toBe("90.00");
      expect(result.totalVat).toBe("18.00");
    });

    it("handles 100% discount", () => {
      const result = computeLineTotal({
        quantity: 5,
        unitPrice: 200,
        discountPercent: 100,
        vatRate: 20,
      });
      expect(result.totalHt).toBe("0.00");
      expect(result.totalVat).toBe("0.00");
    });

    it("handles fractional quantities (labor hours)", () => {
      const result = computeLineTotal({
        quantity: 1.5,
        unitPrice: 60,
        discountPercent: 0,
        vatRate: 20,
      });
      // 1.5 * 60 = 90 HT, 90 * 0.20 = 18 VAT
      expect(result.totalHt).toBe("90.00");
      expect(result.totalVat).toBe("18.00");
    });

    it("handles 0% VAT rate", () => {
      const result = computeLineTotal({
        quantity: 3,
        unitPrice: 10,
        discountPercent: 0,
        vatRate: 0,
      });
      expect(result.totalHt).toBe("30.00");
      expect(result.totalVat).toBe("0.00");
    });

    it("handles reduced VAT rate (5.5%)", () => {
      const result = computeLineTotal({
        quantity: 1,
        unitPrice: 100,
        discountPercent: 0,
        vatRate: 5.5,
      });
      expect(result.totalHt).toBe("100.00");
      expect(result.totalVat).toBe("5.50");
    });

    it("rounds to 2 decimal places", () => {
      const result = computeLineTotal({
        quantity: 3,
        unitPrice: 7.33,
        discountPercent: 0,
        vatRate: 20,
      });
      // 3 * 7.33 = 21.99 HT, 21.99 * 0.20 = 4.398 → 4.40
      expect(result.totalHt).toBe("21.99");
      expect(result.totalVat).toBe("4.40");
    });
  });

  // ── computeInvoiceTotals ──

  describe("computeInvoiceTotals", () => {
    it("sums multiple lines correctly", () => {
      const lines = [
        { totalHt: "100.00", totalVat: "20.00" },
        { totalHt: "50.00", totalVat: "10.00" },
        { totalHt: "25.00", totalVat: "5.00" },
      ];
      const result = computeInvoiceTotals(lines);
      expect(result.totalHt).toBe("175.00");
      expect(result.totalVat).toBe("35.00");
      expect(result.totalTtc).toBe("210.00");
    });

    it("returns zeros for empty lines", () => {
      const result = computeInvoiceTotals([]);
      expect(result.totalHt).toBe("0.00");
      expect(result.totalVat).toBe("0.00");
      expect(result.totalTtc).toBe("0.00");
    });

    it("handles a single line", () => {
      const result = computeInvoiceTotals([{ totalHt: "99.99", totalVat: "20.00" }]);
      expect(result.totalHt).toBe("99.99");
      expect(result.totalVat).toBe("20.00");
      expect(result.totalTtc).toBe("119.99");
    });

    it("handles decimal precision across many lines", () => {
      // 10 lines at 33.33 HT and 6.67 VAT
      const lines = Array.from({ length: 10 }, () => ({
        totalHt: "33.33",
        totalVat: "6.67",
      }));
      const result = computeInvoiceTotals(lines);
      expect(result.totalHt).toBe("333.30");
      expect(result.totalVat).toBe("66.70");
      expect(result.totalTtc).toBe("400.00");
    });
  });

  // ── computePaymentStatus ──

  describe("computePaymentStatus", () => {
    it("marks as paid when full amount is paid", () => {
      const result = computePaymentStatus("finalized", 0, 120, 120);
      expect(result.newStatus).toBe("paid");
      expect(result.newAmountPaid).toBe("120.00");
    });

    it("marks as paid when overpaid", () => {
      const result = computePaymentStatus("finalized", 0, 150, 120);
      expect(result.newStatus).toBe("paid");
      expect(result.newAmountPaid).toBe("150.00");
    });

    it("marks as partially_paid when partial payment", () => {
      const result = computePaymentStatus("finalized", 0, 50, 120);
      expect(result.newStatus).toBe("partially_paid");
      expect(result.newAmountPaid).toBe("50.00");
    });

    it("accumulates payments across multiple calls", () => {
      // First payment
      const first = computePaymentStatus("finalized", 0, 60, 120);
      expect(first.newStatus).toBe("partially_paid");

      // Second payment completes it
      const second = computePaymentStatus("partially_paid", 60, 60, 120);
      expect(second.newStatus).toBe("paid");
      expect(second.newAmountPaid).toBe("120.00");
    });

    it("keeps current status when payment is zero", () => {
      const result = computePaymentStatus("finalized", 0, 0, 120);
      expect(result.newStatus).toBe("finalized");
      expect(result.newAmountPaid).toBe("0.00");
    });

    it("marks zero-TTC invoice as paid (0 >= 0)", () => {
      const result = computePaymentStatus("finalized", 0, 0, 0);
      expect(result.newStatus).toBe("paid");
    });

    it("handles decimal amounts", () => {
      const result = computePaymentStatus("finalized", 0, 99.99, 99.99);
      expect(result.newStatus).toBe("paid");
      expect(result.newAmountPaid).toBe("99.99");
    });
  });

  // ── FEC Export ──

  describe("formatFECDate", () => {
    it("formats a standard date as YYYYMMDD", () => {
      expect(formatFECDate(new Date("2025-03-15"))).toBe("20250315");
    });

    it("zero-pads month and day", () => {
      expect(formatFECDate(new Date("2025-01-05"))).toBe("20250105");
    });

    it("handles end-of-year date", () => {
      expect(formatFECDate(new Date("2025-12-31"))).toBe("20251231");
    });
  });

  describe("formatFECLine", () => {
    it("produces tab-separated FEC line", () => {
      const line = formatFECLine({
        invoiceNumber: "FA-00001",
        issueDate: new Date("2025-06-15"),
        customerName: "Claire Dupont",
        totalTtc: "1200.00",
      });

      const parts = line.split("\t");
      expect(parts).toHaveLength(18);
      expect(parts[0]).toBe("VE");
      expect(parts[1]).toBe("Journal des ventes");
      expect(parts[2]).toBe("FA-00001");
      expect(parts[3]).toBe("20250615");
      expect(parts[4]).toBe("411000");
      expect(parts[5]).toBe("Claire Dupont");
      expect(parts[10]).toBe("Facture FA-00001");
      expect(parts[11]).toBe("1200.00"); // Debit
      expect(parts[12]).toBe("0.00"); // Credit
      expect(parts[17]).toBe("EUR");
    });
  });

  describe("FEC_HEADER", () => {
    it("contains all 18 required FEC columns", () => {
      const columns = FEC_HEADER.split("\t");
      expect(columns).toHaveLength(18);
      expect(columns[0]).toBe("JournalCode");
      expect(columns[17]).toBe("Idevise");
    });
  });
});

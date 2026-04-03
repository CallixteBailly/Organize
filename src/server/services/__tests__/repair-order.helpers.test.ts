import { describe, it, expect } from "vitest";
import {
  computeROLineTotal,
  computeROTotals,
  computeStockDeductions,
  formatDocumentNumber,
} from "../helpers/repair-order.helpers";

describe("Repair order helpers", () => {
  // ── computeROLineTotal ──

  describe("computeROLineTotal", () => {
    it("computes HT for a simple line", () => {
      expect(computeROLineTotal({ quantity: 2, unitPrice: 50, discountPercent: 0 })).toBe(
        "100.00",
      );
    });

    it("applies discount", () => {
      expect(computeROLineTotal({ quantity: 1, unitPrice: 200, discountPercent: 15 })).toBe(
        "170.00",
      );
    });

    it("handles 50% discount", () => {
      expect(computeROLineTotal({ quantity: 4, unitPrice: 25, discountPercent: 50 })).toBe(
        "50.00",
      );
    });

    it("handles fractional quantity (0.5h labor)", () => {
      expect(computeROLineTotal({ quantity: 0.5, unitPrice: 80, discountPercent: 0 })).toBe(
        "40.00",
      );
    });

    it("rounds to 2 decimals", () => {
      // 3 * 7.33 * (1 - 0) = 21.99
      expect(computeROLineTotal({ quantity: 3, unitPrice: 7.33, discountPercent: 0 })).toBe(
        "21.99",
      );
    });
  });

  // ── computeROTotals ──

  describe("computeROTotals", () => {
    it("splits parts and labor correctly", () => {
      const lines = [
        { type: "part" as const, totalHt: "100.00", vatRate: "20" },
        { type: "labor" as const, totalHt: "200.00", vatRate: "20" },
      ];
      const result = computeROTotals(lines);
      expect(result.totalPartsHt).toBe("100.00");
      expect(result.totalLaborHt).toBe("200.00");
      expect(result.totalHt).toBe("300.00");
      expect(result.totalVat).toBe("60.00");
      expect(result.totalTtc).toBe("360.00");
    });

    it("handles multiple parts with different VAT rates", () => {
      const lines = [
        { type: "part" as const, totalHt: "100.00", vatRate: "20" },
        { type: "part" as const, totalHt: "50.00", vatRate: "5.5" },
      ];
      const result = computeROTotals(lines);
      expect(result.totalPartsHt).toBe("150.00");
      expect(result.totalLaborHt).toBe("0.00");
      // VAT: 100*0.20 + 50*0.055 = 20 + 2.75 = 22.75
      expect(result.totalVat).toBe("22.75");
      expect(result.totalTtc).toBe("172.75");
    });

    it("treats 'other' type as labor (non-part)", () => {
      const lines = [
        { type: "other" as const, totalHt: "30.00", vatRate: "20" },
      ];
      const result = computeROTotals(lines);
      expect(result.totalPartsHt).toBe("0.00");
      expect(result.totalLaborHt).toBe("30.00");
    });

    it("returns zeros for empty lines", () => {
      const result = computeROTotals([]);
      expect(result.totalPartsHt).toBe("0.00");
      expect(result.totalLaborHt).toBe("0.00");
      expect(result.totalHt).toBe("0.00");
      expect(result.totalVat).toBe("0.00");
      expect(result.totalTtc).toBe("0.00");
    });

    it("handles a realistic repair order", () => {
      const lines = [
        { type: "part" as const, totalHt: "45.00", vatRate: "20" },
        { type: "part" as const, totalHt: "120.00", vatRate: "20" },
        { type: "labor" as const, totalHt: "180.00", vatRate: "20" },
        { type: "labor" as const, totalHt: "60.00", vatRate: "20" },
      ];
      const result = computeROTotals(lines);
      expect(result.totalPartsHt).toBe("165.00");
      expect(result.totalLaborHt).toBe("240.00");
      expect(result.totalHt).toBe("405.00");
      expect(result.totalVat).toBe("81.00");
      expect(result.totalTtc).toBe("486.00");
    });
  });

  // ── computeStockDeductions ──

  describe("computeStockDeductions", () => {
    it("extracts parts with stock items", () => {
      const lines = [
        { type: "part" as const, stockItemId: "stock-1", quantity: "2", unitPrice: "45.00" },
        { type: "labor" as const, stockItemId: null, quantity: "1", unitPrice: "60.00" },
        { type: "part" as const, stockItemId: "stock-2", quantity: "1", unitPrice: "120.00" },
      ];
      const result = computeStockDeductions(lines);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ stockItemId: "stock-1", quantity: 2, unitPrice: "45.00" });
      expect(result[1]).toEqual({ stockItemId: "stock-2", quantity: 1, unitPrice: "120.00" });
    });

    it("skips parts without stockItemId", () => {
      const lines = [
        { type: "part" as const, stockItemId: null, quantity: "3", unitPrice: "10.00" },
      ];
      expect(computeStockDeductions(lines)).toHaveLength(0);
    });

    it("skips labor lines even with stockItemId", () => {
      const lines = [
        { type: "labor" as const, stockItemId: "stock-1", quantity: "1", unitPrice: "60.00" },
      ];
      expect(computeStockDeductions(lines)).toHaveLength(0);
    });

    it("returns empty for no lines", () => {
      expect(computeStockDeductions([])).toHaveLength(0);
    });

    it("uses absolute value for quantity", () => {
      const lines = [
        { type: "part" as const, stockItemId: "stock-1", quantity: "-3", unitPrice: "10.00" },
      ];
      const result = computeStockDeductions(lines);
      expect(result[0].quantity).toBe(3);
    });
  });

  // ── formatDocumentNumber ──

  describe("formatDocumentNumber", () => {
    it("formats with default prefix and padding", () => {
      expect(formatDocumentNumber("OR", 1)).toBe("OR-00001");
    });

    it("pads to 5 digits", () => {
      expect(formatDocumentNumber("FA", 42)).toBe("FA-00042");
    });

    it("handles large numbers", () => {
      expect(formatDocumentNumber("DE", 99999)).toBe("DE-99999");
    });

    it("handles numbers exceeding 5 digits", () => {
      expect(formatDocumentNumber("FA", 100000)).toBe("FA-100000");
    });

    it("works with custom prefixes", () => {
      expect(formatDocumentNumber("FACT", 1)).toBe("FACT-00001");
    });
  });
});

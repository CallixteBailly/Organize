import { describe, it, expect } from "vitest";
import { computeStockDelta } from "../helpers/stock.helpers";

describe("Stock helpers", () => {
  describe("computeStockDelta", () => {
    it("returns positive delta for entry", () => {
      expect(computeStockDelta("entry", 5)).toBe(5);
    });

    it("returns negative delta for exit", () => {
      expect(computeStockDelta("exit", 3)).toBe(-3);
    });

    it("returns positive delta for adjustment", () => {
      expect(computeStockDelta("adjustment", 10)).toBe(10);
    });

    it("returns positive delta for return", () => {
      expect(computeStockDelta("return", 2)).toBe(2);
    });

    it("handles exit with already-negative quantity (uses abs)", () => {
      expect(computeStockDelta("exit", -7)).toBe(-7);
    });

    it("handles entry with negative quantity (uses abs)", () => {
      expect(computeStockDelta("entry", -4)).toBe(4);
    });

    it("handles zero quantity", () => {
      expect(computeStockDelta("entry", 0)).toBe(0);
      expect(computeStockDelta("exit", 0)).toBe(-0);
    });

    it("handles fractional quantities", () => {
      expect(computeStockDelta("entry", 0.5)).toBe(0.5);
      expect(computeStockDelta("exit", 0.5)).toBe(-0.5);
    });
  });
});

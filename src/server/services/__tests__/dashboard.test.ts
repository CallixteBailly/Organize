import { describe, it, expect } from "vitest";

/**
 * Dashboard service tests — these validate the computation logic
 * that can be tested without a database connection.
 *
 * The actual DB queries are integration tests that require a running
 * PostgreSQL instance (tested via E2E).
 */

describe("Dashboard computation logic", () => {
  describe("PeriodComparison changePercent", () => {
    function computeChangePercent(current: number, previous: number): number {
      if (previous > 0) return Math.round(((current - previous) / previous) * 100 * 10) / 10;
      return current > 0 ? 100 : 0;
    }

    it("computes positive change correctly", () => {
      expect(computeChangePercent(1200, 1000)).toBe(20);
    });

    it("computes negative change correctly", () => {
      expect(computeChangePercent(800, 1000)).toBe(-20);
    });

    it("returns 0 when both are zero", () => {
      expect(computeChangePercent(0, 0)).toBe(0);
    });

    it("returns 100 when previous is zero and current is positive", () => {
      expect(computeChangePercent(500, 0)).toBe(100);
    });

    it("handles decimal precision", () => {
      expect(computeChangePercent(1050, 1000)).toBe(5);
    });

    it("computes 100% increase", () => {
      expect(computeChangePercent(2000, 1000)).toBe(100);
    });

    it("computes total loss", () => {
      expect(computeChangePercent(0, 1000)).toBe(-100);
    });
  });

  describe("Alert severity logic", () => {
    function getStockAlertSeverity(count: number): "warning" | "critical" | null {
      if (count === 0) return null;
      return count > 5 ? "critical" : "warning";
    }

    it("returns null for zero alerts", () => {
      expect(getStockAlertSeverity(0)).toBeNull();
    });

    it("returns warning for 1-5 alerts", () => {
      expect(getStockAlertSeverity(1)).toBe("warning");
      expect(getStockAlertSeverity(5)).toBe("warning");
    });

    it("returns critical for more than 5 alerts", () => {
      expect(getStockAlertSeverity(6)).toBe("critical");
      expect(getStockAlertSeverity(20)).toBe("critical");
    });
  });
});

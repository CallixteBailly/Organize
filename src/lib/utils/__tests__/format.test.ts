import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatPhone } from "../format";

describe("formatCurrency", () => {
  it("formats number correctly", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1");
    expect(result).toContain("234");
    expect(result).toContain("56");
  });

  it("formats string amount correctly", () => {
    const result = formatCurrency("99.90");
    expect(result).toContain("99");
    expect(result).toContain("90");
  });

  it("handles zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("returns dash for NaN", () => {
    expect(formatCurrency("")).toBe("—");
    expect(formatCurrency("abc")).toBe("—");
    expect(formatCurrency(NaN)).toBe("—");
  });

  it("formats negative amounts", () => {
    const result = formatCurrency(-50.00);
    expect(result).toContain("50");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date("2026-03-15"));
    expect(result).toContain("15");
    expect(result).toContain("03");
    expect(result).toContain("2026");
  });

  it("formats a string date", () => {
    const result = formatDate("2026-01-01");
    expect(result).toContain("01");
    expect(result).toContain("2026");
  });
});

describe("formatPhone", () => {
  it("formats 10-digit French phone number", () => {
    expect(formatPhone("0612345678")).toBe("06 12 34 56 78");
  });

  it("returns original if not 10 digits", () => {
    expect(formatPhone("+33612345678")).toBe("+33612345678");
  });

  it("handles already formatted number", () => {
    expect(formatPhone("06 12 34 56 78")).toBe("06 12 34 56 78");
  });
});

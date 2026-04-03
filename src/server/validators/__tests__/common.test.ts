import { describe, it, expect } from "vitest";
import { paginationSchema, idParamSchema } from "../common";

describe("paginationSchema", () => {
  it("accepts valid page and limit", () => {
    const result = paginationSchema.safeParse({ page: 2, limit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it("uses default values when omitted", () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("coerces string values to numbers", () => {
    const result = paginationSchema.safeParse({ page: "3", limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(10);
    }
  });

  it("rejects page less than 1", () => {
    const result = paginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative page", () => {
    const result = paginationSchema.safeParse({ page: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects limit greater than 100", () => {
    const result = paginationSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects limit of 0", () => {
    const result = paginationSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer values", () => {
    const result = paginationSchema.safeParse({ page: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe("idParamSchema", () => {
  it("accepts valid UUID", () => {
    const result = idParamSchema.safeParse({ id: "550e8400-e29b-41d4-a716-446655440000" });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID string", () => {
    const result = idParamSchema.safeParse({ id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = idParamSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    const result = idParamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

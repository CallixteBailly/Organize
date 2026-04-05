import { describe, it, expect } from "vitest";
import { activityFiltersSchema } from "../activity-log";

describe("activityFiltersSchema", () => {
  it("accepts empty filters", () => {
    const result = activityFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts all filters", () => {
    const result = activityFiltersSchema.safeParse({
      entityType: "customer",
      action: "create",
      source: "user",
      search: "facture",
      userId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.entityType).toBe("customer");
      expect(result.data.action).toBe("create");
      expect(result.data.source).toBe("user");
      expect(result.data.search).toBe("facture");
    }
  });

  it("accepts source = ai", () => {
    const result = activityFiltersSchema.safeParse({ source: "ai" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid source", () => {
    const result = activityFiltersSchema.safeParse({ source: "system" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid userId (not uuid)", () => {
    const result = activityFiltersSchema.safeParse({ userId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("accepts undefined optional fields", () => {
    const result = activityFiltersSchema.safeParse({
      entityType: undefined,
      action: undefined,
      source: undefined,
      search: undefined,
      userId: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial filters", () => {
    const result = activityFiltersSchema.safeParse({
      entityType: "invoice",
      source: "ai",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.entityType).toBe("invoice");
      expect(result.data.source).toBe("ai");
      expect(result.data.action).toBeUndefined();
      expect(result.data.search).toBeUndefined();
    }
  });
});

import { describe, it, expect } from "vitest";
import { createQuoteSchema, quoteLineSchema } from "../quote";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

describe("createQuoteSchema", () => {
  it("accepts minimal quote", () => {
    const result = createQuoteSchema.safeParse({
      customerId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  it("accepts quote with all fields", () => {
    const result = createQuoteSchema.safeParse({
      customerId: validUuid,
      vehicleId: validUuid,
      validUntil: "2026-04-30",
      notes: "Devis pour revision complete",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing customerId", () => {
    const result = createQuoteSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts empty vehicleId", () => {
    const result = createQuoteSchema.safeParse({
      customerId: validUuid,
      vehicleId: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("quoteLineSchema", () => {
  it("accepts valid quote line", () => {
    const result = quoteLineSchema.safeParse({
      quoteId: validUuid,
      type: "part",
      description: "Plaquettes de frein AV",
      quantity: "2",
      unitPrice: "45.00",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vatRate).toBe(20);
      expect(result.data.quantity).toBe(2);
      expect(result.data.unitPrice).toBe(45);
    }
  });

  it("rejects missing quoteId", () => {
    const result = quoteLineSchema.safeParse({
      type: "part",
      description: "Test",
      quantity: "1",
      unitPrice: "10",
    });
    expect(result.success).toBe(false);
  });

  it("accepts labor with fractional quantity", () => {
    const result = quoteLineSchema.safeParse({
      quoteId: validUuid,
      type: "labor",
      description: "Remplacement plaquettes",
      quantity: "1.5",
      unitPrice: "60",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1.5);
    }
  });
});

import { describe, it, expect } from "vitest";
import { createRepairOrderSchema, repairOrderLineSchema, signatureSchema } from "../repair-order";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

describe("createRepairOrderSchema", () => {
  it("accepts valid repair order", () => {
    const result = createRepairOrderSchema.safeParse({
      customerId: validUuid,
      vehicleId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  it("accepts repair order with all fields", () => {
    const result = createRepairOrderSchema.safeParse({
      customerId: validUuid,
      vehicleId: validUuid,
      mileageAtIntake: "85000",
      customerComplaint: "Bruit au freinage",
      assignedTo: validUuid,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mileageAtIntake).toBe(85000);
    }
  });

  it("rejects missing customerId", () => {
    const result = createRepairOrderSchema.safeParse({
      vehicleId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing vehicleId", () => {
    const result = createRepairOrderSchema.safeParse({
      customerId: validUuid,
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty assignedTo", () => {
    const result = createRepairOrderSchema.safeParse({
      customerId: validUuid,
      vehicleId: validUuid,
      assignedTo: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("repairOrderLineSchema", () => {
  it("accepts valid part line", () => {
    const result = repairOrderLineSchema.safeParse({
      repairOrderId: validUuid,
      type: "part",
      description: "Filtre a huile",
      quantity: "1",
      unitPrice: "15.50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vatRate).toBe(20);
      expect(result.data.discountPercent).toBe(0);
    }
  });

  it("accepts labor line", () => {
    const result = repairOrderLineSchema.safeParse({
      repairOrderId: validUuid,
      type: "labor",
      description: "Diagnostic freinage",
      quantity: "0.5",
      unitPrice: "60",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(0.5);
    }
  });

  it("rejects zero quantity", () => {
    const result = repairOrderLineSchema.safeParse({
      repairOrderId: validUuid,
      type: "part",
      description: "Test",
      quantity: "0",
      unitPrice: "10",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = repairOrderLineSchema.safeParse({
      repairOrderId: validUuid,
      type: "part",
      description: "",
      quantity: "1",
      unitPrice: "10",
    });
    expect(result.success).toBe(false);
  });

  it("accepts discount up to 100%", () => {
    const result = repairOrderLineSchema.safeParse({
      repairOrderId: validUuid,
      type: "part",
      description: "Offert",
      quantity: "1",
      unitPrice: "50",
      discountPercent: "100",
    });
    expect(result.success).toBe(true);
  });

  it("rejects discount over 100%", () => {
    const result = repairOrderLineSchema.safeParse({
      repairOrderId: validUuid,
      type: "part",
      description: "Test",
      quantity: "1",
      unitPrice: "50",
      discountPercent: "150",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all line types", () => {
    for (const type of ["part", "labor", "other"]) {
      const result = repairOrderLineSchema.safeParse({
        repairOrderId: validUuid,
        type,
        description: "Test",
        quantity: "1",
        unitPrice: "10",
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("signatureSchema", () => {
  it("accepts valid signature data URL", () => {
    const result = signatureSchema.safeParse({
      signatureDataUrl: "data:image/png;base64,iVBORw0KGgo...",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty signature", () => {
    const result = signatureSchema.safeParse({ signatureDataUrl: "" });
    expect(result.success).toBe(false);
  });
});

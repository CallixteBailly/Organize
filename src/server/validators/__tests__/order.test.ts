import { describe, it, expect } from "vitest";
import {
  createSupplierSchema,
  createOrderSchema,
  quickOrderSchema,
} from "../order";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

describe("createSupplierSchema", () => {
  it("accepts valid supplier", () => {
    const result = createSupplierSchema.safeParse({ name: "Auto Pieces 31" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createSupplierSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts supplier with all fields", () => {
    const result = createSupplierSchema.safeParse({
      name: "Auto Pieces 31",
      code: "AP31",
      contactName: "Jean Dupont",
      email: "contact@ap31.fr",
      phone: "0561234567",
      deliveryDays: "2",
      minOrderAmount: "50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deliveryDays).toBe(2);
      expect(result.data.minOrderAmount).toBe(50);
    }
  });

  it("rejects invalid email", () => {
    const result = createSupplierSchema.safeParse({
      name: "Test",
      email: "not-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty optional strings", () => {
    const result = createSupplierSchema.safeParse({
      name: "Test",
      email: "",
      website: "",
      code: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid website URL", () => {
    const result = createSupplierSchema.safeParse({
      name: "Test",
      website: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("createOrderSchema", () => {
  it("accepts valid order with items", () => {
    const result = createOrderSchema.safeParse({
      supplierId: validUuid,
      items: [
        { reference: "REF-001", name: "Filtre", quantity: 2, unitPrice: 15.5 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects order without items", () => {
    const result = createOrderSchema.safeParse({
      supplierId: validUuid,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects item with zero quantity", () => {
    const result = createOrderSchema.safeParse({
      supplierId: validUuid,
      items: [
        { reference: "REF-001", name: "Filtre", quantity: 0, unitPrice: 15 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts multiple items", () => {
    const result = createOrderSchema.safeParse({
      supplierId: validUuid,
      notes: "Urgent",
      items: [
        { reference: "REF-001", name: "Filtre huile", quantity: 5, unitPrice: 8.5 },
        { reference: "REF-002", name: "Filtre air", quantity: 3, unitPrice: 12 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(2);
    }
  });
});

describe("quickOrderSchema", () => {
  it("accepts valid quick order", () => {
    const result = quickOrderSchema.safeParse({
      stockItemId: validUuid,
      supplierId: validUuid,
      quantity: "3",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(3);
    }
  });

  it("rejects zero quantity", () => {
    const result = quickOrderSchema.safeParse({
      stockItemId: validUuid,
      supplierId: validUuid,
      quantity: "0",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing supplierId", () => {
    const result = quickOrderSchema.safeParse({
      stockItemId: validUuid,
      quantity: "1",
    });
    expect(result.success).toBe(false);
  });
});

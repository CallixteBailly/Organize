import { describe, it, expect } from "vitest";
import {
  createStockItemSchema,
  createStockMovementSchema,
  createCategorySchema,
} from "../stock";

describe("createStockItemSchema", () => {
  it("accepts valid stock item data", () => {
    const result = createStockItemSchema.safeParse({
      reference: "REF-001",
      name: "Filtre a huile",
      sellingPrice: "15.50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vatRate).toBe(20);
      expect(result.data.quantity).toBe(0);
      expect(result.data.minQuantity).toBe(0);
    }
  });

  it("rejects missing reference", () => {
    const result = createStockItemSchema.safeParse({
      name: "Filtre a huile",
      sellingPrice: "15.50",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing selling price", () => {
    const result = createStockItemSchema.safeParse({
      reference: "REF-001",
      name: "Filtre a huile",
    });
    expect(result.success).toBe(false);
  });

  it("coerces numeric strings to numbers", () => {
    const result = createStockItemSchema.safeParse({
      reference: "REF-001",
      name: "Filtre",
      sellingPrice: "25.99",
      purchasePrice: "12.50",
      vatRate: "20",
      quantity: "10",
      minQuantity: "2",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sellingPrice).toBe(25.99);
      expect(result.data.purchasePrice).toBe(12.5);
      expect(result.data.quantity).toBe(10);
    }
  });

  it("rejects negative selling price", () => {
    const result = createStockItemSchema.safeParse({
      reference: "REF-001",
      name: "Filtre",
      sellingPrice: "-5",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty barcode as optional", () => {
    const result = createStockItemSchema.safeParse({
      reference: "REF-001",
      name: "Filtre",
      sellingPrice: "10",
      barcode: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("createStockMovementSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("accepts valid movement", () => {
    const result = createStockMovementSchema.safeParse({
      stockItemId: validUuid,
      type: "entry",
      quantity: "5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(5);
    }
  });

  it("accepts all movement types", () => {
    for (const type of ["entry", "exit", "adjustment", "return"]) {
      const result = createStockMovementSchema.safeParse({
        stockItemId: validUuid,
        type,
        quantity: "1",
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid movement type", () => {
    const result = createStockMovementSchema.safeParse({
      stockItemId: validUuid,
      type: "transfer",
      quantity: "1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero quantity", () => {
    const result = createStockMovementSchema.safeParse({
      stockItemId: validUuid,
      type: "entry",
      quantity: "0",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing stockItemId", () => {
    const result = createStockMovementSchema.safeParse({
      type: "entry",
      quantity: "1",
    });
    expect(result.success).toBe(false);
  });
});

describe("createCategorySchema", () => {
  it("accepts valid category", () => {
    const result = createCategorySchema.safeParse({ name: "Filtres" });
    expect(result.success).toBe(true);
  });

  it("accepts category with color", () => {
    const result = createCategorySchema.safeParse({
      name: "Freinage",
      color: "#ff0000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid hex color", () => {
    const result = createCategorySchema.safeParse({
      name: "Freinage",
      color: "red",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createCategorySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

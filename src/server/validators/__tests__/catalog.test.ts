import { describe, it, expect } from "vitest";
import { plateSearchSchema, catalogLineSchema } from "../catalog";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

describe("plateSearchSchema", () => {
  it("accepte une plaque SIV valide", () => {
    const result = plateSearchSchema.safeParse({ plate: "FK-799-LL" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.plate).toBe("FK799LL");
    }
  });

  it("normalise en majuscules sans tirets ni espaces", () => {
    const result = plateSearchSchema.safeParse({ plate: "fk 799 ll" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.plate).toBe("FK799LL");
    }
  });

  it("accepte les anciens formats (ex: 1234 AB 75)", () => {
    const result = plateSearchSchema.safeParse({ plate: "1234 AB 75" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.plate).toBe("1234AB75");
    }
  });

  it("rejette une plaque trop courte", () => {
    const result = plateSearchSchema.safeParse({ plate: "AB1" });
    expect(result.success).toBe(false);
  });

  it("rejette une plaque trop longue", () => {
    const result = plateSearchSchema.safeParse({ plate: "ABCDEFGHIJKLMNOP" });
    expect(result.success).toBe(false);
  });

  it("rejette une plaque vide", () => {
    const result = plateSearchSchema.safeParse({ plate: "" });
    expect(result.success).toBe(false);
  });
});

describe("catalogLineSchema", () => {
  it("accepte une ligne valide", () => {
    const result = catalogLineSchema.safeParse({
      repairOrderId: validUuid,
      description: "Filtre à huile Mann W712/52",
      reference: "W71252",
      brand: "Mann-Filter",
      unitPrice: "19.90",
      quantity: "1",
      vatRate: "20",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unitPrice).toBe(19.9);
      expect(result.data.quantity).toBe(1);
      expect(result.data.vatRate).toBe(20);
    }
  });

  it("applique les valeurs par défaut (quantity=1, vatRate=20)", () => {
    const result = catalogLineSchema.safeParse({
      repairOrderId: validUuid,
      description: "Disque de frein",
      unitPrice: "45",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
      expect(result.data.vatRate).toBe(20);
    }
  });

  it("accepte reference et brand optionnels", () => {
    const result = catalogLineSchema.safeParse({
      repairOrderId: validUuid,
      description: "Pièce sans référence",
      unitPrice: "0",
    });
    expect(result.success).toBe(true);
  });

  it("accepte un prix à 0 (mécanicien saisit le prix)", () => {
    const result = catalogLineSchema.safeParse({
      repairOrderId: validUuid,
      description: "Plaquettes frein",
      unitPrice: "0",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unitPrice).toBe(0);
    }
  });

  it("rejette un prix négatif", () => {
    const result = catalogLineSchema.safeParse({
      repairOrderId: validUuid,
      description: "Plaquettes frein",
      unitPrice: "-5",
    });
    expect(result.success).toBe(false);
  });

  it("rejette une quantité nulle ou négative", () => {
    const result = catalogLineSchema.safeParse({
      repairOrderId: validUuid,
      description: "Filtre",
      unitPrice: "10",
      quantity: "0",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un repairOrderId invalide", () => {
    const result = catalogLineSchema.safeParse({
      repairOrderId: "pas-un-uuid",
      description: "Filtre",
      unitPrice: "10",
    });
    expect(result.success).toBe(false);
  });

  it("rejette une description vide", () => {
    const result = catalogLineSchema.safeParse({
      repairOrderId: validUuid,
      description: "",
      unitPrice: "10",
    });
    expect(result.success).toBe(false);
  });

  it("coerce les valeurs numériques depuis des strings", () => {
    const result = catalogLineSchema.safeParse({
      repairOrderId: validUuid,
      description: "Amortisseur",
      unitPrice: "89.99",
      quantity: "2",
      vatRate: "5.5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unitPrice).toBe(89.99);
      expect(result.data.quantity).toBe(2);
      expect(result.data.vatRate).toBe(5.5);
    }
  });
});

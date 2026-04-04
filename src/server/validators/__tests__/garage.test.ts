import { describe, it, expect } from "vitest";
import { createGarageSchema, updateGarageSchema } from "../garage";

describe("createGarageSchema", () => {
  const validGarage = {
    name: "Garage Martin",
    siret: "12345678901234",
    address: "12 rue de la Paix",
    city: "Paris",
    postalCode: "75001",
  };

  it("accepts valid garage data", () => {
    const result = createGarageSchema.safeParse(validGarage);
    expect(result.success).toBe(true);
  });

  it("accepts with optional phone and email", () => {
    const result = createGarageSchema.safeParse({
      ...validGarage,
      phone: "0612345678",
      email: "contact@garage.fr",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const result = createGarageSchema.safeParse({ ...validGarage, name: "G" });
    expect(result.success).toBe(false);
  });

  it("rejects SIRET with wrong length", () => {
    const result = createGarageSchema.safeParse({ ...validGarage, siret: "1234" });
    expect(result.success).toBe(false);
  });

  it("rejects SIRET with letters", () => {
    const result = createGarageSchema.safeParse({ ...validGarage, siret: "1234567890123A" });
    expect(result.success).toBe(false);
  });

  it("rejects short address", () => {
    const result = createGarageSchema.safeParse({ ...validGarage, address: "12" });
    expect(result.success).toBe(false);
  });

  it("rejects postal code with wrong length", () => {
    const result = createGarageSchema.safeParse({ ...validGarage, postalCode: "7500" });
    expect(result.success).toBe(false);
  });

  it("rejects postal code with letters", () => {
    const result = createGarageSchema.safeParse({ ...validGarage, postalCode: "7500A" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createGarageSchema.safeParse({ ...validGarage, email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("updateGarageSchema", () => {
  it("accepts partial updates (name only)", () => {
    const result = updateGarageSchema.safeParse({ name: "Nouveau Nom" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no changes)", () => {
    const result = updateGarageSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts VAT number", () => {
    const result = updateGarageSchema.safeParse({ vatNumber: "FR12345678901" });
    expect(result.success).toBe(true);
  });

  it("accepts valid website URL", () => {
    const result = updateGarageSchema.safeParse({ website: "https://garage.fr" });
    expect(result.success).toBe(true);
  });

  it("accepts empty string for website (clear field)", () => {
    const result = updateGarageSchema.safeParse({ website: "" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid website URL", () => {
    const result = updateGarageSchema.safeParse({ website: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts invoice prefix", () => {
    const result = updateGarageSchema.safeParse({ invoicePrefix: "FACT" });
    expect(result.success).toBe(true);
  });

  it("rejects prefix longer than 10 chars", () => {
    const result = updateGarageSchema.safeParse({ invoicePrefix: "VERYLONGPREFIX" });
    expect(result.success).toBe(false);
  });

  it("accepts all document prefixes", () => {
    const result = updateGarageSchema.safeParse({
      invoicePrefix: "FA",
      quotePrefix: "DE",
      repairOrderPrefix: "OR",
    });
    expect(result.success).toBe(true);
  });

  it("accepts logo URL", () => {
    const result = updateGarageSchema.safeParse({ logoUrl: "https://cdn.example.com/logo.png" });
    expect(result.success).toBe(true);
  });

  it("accepts empty string for logo URL (clear field)", () => {
    const result = updateGarageSchema.safeParse({ logoUrl: "" });
    expect(result.success).toBe(true);
  });
});

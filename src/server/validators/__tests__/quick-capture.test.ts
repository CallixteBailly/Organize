import { describe, it, expect } from "vitest";
import { quickCaptureInputSchema, quickCaptureParsedSchema, quickCaptureConfirmSchema } from "../quick-capture";

describe("quickCaptureInputSchema", () => {
  it("accepte un texte valide", () => {
    expect(quickCaptureInputSchema.parse({ text: "Vidange Clio de Martin 180€" })).toEqual({
      text: "Vidange Clio de Martin 180€",
    });
  });

  it("rejette un texte trop court", () => {
    expect(() => quickCaptureInputSchema.parse({ text: "ab" })).toThrow();
  });

  it("rejette un texte trop long", () => {
    expect(() => quickCaptureInputSchema.parse({ text: "a".repeat(501) })).toThrow();
  });
});

describe("quickCaptureParsedSchema", () => {
  const valid = {
    customer: { firstName: "Jean", lastName: "Martin", companyName: null },
    vehicle: { brand: "Renault", model: "Clio 4", licensePlate: null, year: null },
    service: { description: "Vidange", type: "labor" as const },
    amount: 180,
    mileage: null,
    payment: { method: "card" as const, isPaid: true },
    confidence: 0.9,
  };

  it("accepte un objet complet valide", () => {
    expect(() => quickCaptureParsedSchema.parse(valid)).not.toThrow();
  });

  it("accepte sans paiement (null)", () => {
    expect(() => quickCaptureParsedSchema.parse({ ...valid, payment: null })).not.toThrow();
  });

  it("accepte sans montant (null)", () => {
    expect(() => quickCaptureParsedSchema.parse({ ...valid, amount: null })).not.toThrow();
  });

  it("rejette un type de service invalide", () => {
    expect(() =>
      quickCaptureParsedSchema.parse({ ...valid, service: { description: "test", type: "invalid" } })
    ).toThrow();
  });

  it("rejette une confidence hors de [0,1]", () => {
    expect(() => quickCaptureParsedSchema.parse({ ...valid, confidence: 1.5 })).toThrow();
    expect(() => quickCaptureParsedSchema.parse({ ...valid, confidence: -0.1 })).toThrow();
  });
});

describe("quickCaptureConfirmSchema", () => {
  const valid = {
    rawText: "Vidange Clio de Martin 180€ payé CB",
    customer: { existingId: "550e8400-e29b-41d4-a716-446655440001" },
    vehicle: { existingId: "550e8400-e29b-41d4-a716-446655440002" },
    service: { description: "Vidange", type: "labor" as const },
    amount: 180,
    mileage: undefined,
    payment: { method: "card" as const },
    createInvoice: true,
  };

  it("accepte un payload valide avec IDs existants", () => {
    expect(() => quickCaptureConfirmSchema.parse(valid)).not.toThrow();
  });

  it("accepte un nouveau client + nouveau véhicule", () => {
    const data = {
      rawText: "Vidange 206 de Dupont 150€",
      customer: { firstName: "Paul", lastName: "Dupont" },
      vehicle: { brand: "Peugeot", model: "206" },
      service: { description: "Vidange huile", type: "labor" as const },
      amount: 150,
      createInvoice: false,
    };
    expect(() => quickCaptureConfirmSchema.parse(data)).not.toThrow();
  });

  it("rejette si description de service vide", () => {
    expect(() =>
      quickCaptureConfirmSchema.parse({ ...valid, service: { description: "", type: "labor" } })
    ).toThrow();
  });

  it("rejette un UUID invalide", () => {
    expect(() =>
      quickCaptureConfirmSchema.parse({ ...valid, customer: { existingId: "pas-un-uuid" } })
    ).toThrow();
  });
});

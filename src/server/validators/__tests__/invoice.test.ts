import { describe, it, expect } from "vitest";
import { createInvoiceSchema, invoiceLineSchema, recordPaymentSchema } from "../invoice";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

describe("createInvoiceSchema", () => {
  it("accepts valid invoice", () => {
    const result = createInvoiceSchema.safeParse({
      customerId: validUuid,
      dueDate: "2026-04-30",
    });
    expect(result.success).toBe(true);
  });

  it("accepts invoice with all fields", () => {
    const result = createInvoiceSchema.safeParse({
      customerId: validUuid,
      repairOrderId: validUuid,
      dueDate: "2026-04-30",
      notes: "Facture revision",
      paymentTerms: "30 jours net",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing customerId", () => {
    const result = createInvoiceSchema.safeParse({ dueDate: "2026-04-30" });
    expect(result.success).toBe(false);
  });

  it("rejects missing dueDate", () => {
    const result = createInvoiceSchema.safeParse({ customerId: validUuid });
    expect(result.success).toBe(false);
  });

  it("accepts empty repairOrderId", () => {
    const result = createInvoiceSchema.safeParse({
      customerId: validUuid,
      dueDate: "2026-04-30",
      repairOrderId: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("invoiceLineSchema", () => {
  it("accepts valid line", () => {
    const result = invoiceLineSchema.safeParse({
      invoiceId: validUuid,
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

  it("rejects empty description", () => {
    const result = invoiceLineSchema.safeParse({
      invoiceId: validUuid,
      type: "part",
      description: "",
      quantity: "1",
      unitPrice: "10",
    });
    expect(result.success).toBe(false);
  });
});

describe("recordPaymentSchema", () => {
  it("accepts valid payment", () => {
    const result = recordPaymentSchema.safeParse({
      invoiceId: validUuid,
      amount: "150.00",
      method: "card",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(150);
    }
  });

  it("accepts all payment methods", () => {
    for (const method of ["cash", "card", "bank_transfer", "check", "online"]) {
      const result = recordPaymentSchema.safeParse({
        invoiceId: validUuid,
        amount: "10",
        method,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects zero amount", () => {
    const result = recordPaymentSchema.safeParse({
      invoiceId: validUuid,
      amount: "0",
      method: "cash",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid method", () => {
    const result = recordPaymentSchema.safeParse({
      invoiceId: validUuid,
      amount: "100",
      method: "bitcoin",
    });
    expect(result.success).toBe(false);
  });
});

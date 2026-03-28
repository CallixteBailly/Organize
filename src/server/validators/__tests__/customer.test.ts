import { describe, it, expect } from "vitest";
import { createCustomerSchema } from "../customer";

describe("createCustomerSchema", () => {
  it("accepts minimal individual customer", () => {
    const result = createCustomerSchema.safeParse({
      firstName: "Jean",
      lastName: "Dupont",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("individual");
    }
  });

  it("accepts company customer", () => {
    const result = createCustomerSchema.safeParse({
      type: "company",
      companyName: "SARL Martin Auto",
      siret: "12345678901234",
      email: "contact@martin-auto.fr",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty optional fields", () => {
    const result = createCustomerSchema.safeParse({
      firstName: "Marie",
      email: "",
      phone: "",
      siret: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email when provided", () => {
    const result = createCustomerSchema.safeParse({
      firstName: "Jean",
      email: "not-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid SIRET when provided", () => {
    const result = createCustomerSchema.safeParse({
      firstName: "Jean",
      siret: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone too short when provided", () => {
    const result = createCustomerSchema.safeParse({
      firstName: "Jean",
      phone: "0123",
    });
    expect(result.success).toBe(false);
  });
});

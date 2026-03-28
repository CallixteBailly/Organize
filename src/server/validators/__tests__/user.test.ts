import { describe, it, expect } from "vitest";
import { registerSchema, createUserSchema, updateUserSchema } from "../user";

describe("registerSchema", () => {
  const validData = {
    garageName: "Garage Martin",
    siret: "12345678901234",
    address: "12 rue de la Paix",
    city: "Paris",
    postalCode: "75001",
    firstName: "Jean",
    lastName: "Martin",
    email: "jean@garage.fr",
    password: "motdepasse123",
    confirmPassword: "motdepasse123",
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid SIRET (not 14 digits)", () => {
    const result = registerSchema.safeParse({
      ...validData,
      siret: "1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects SIRET with letters", () => {
    const result = registerSchema.safeParse({
      ...validData,
      siret: "1234567890ABCD",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid postal code", () => {
    const result = registerSchema.safeParse({
      ...validData,
      postalCode: "7500",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password (<8 chars)", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      ...validData,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("createUserSchema", () => {
  it("accepts valid user data", () => {
    const result = createUserSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      email: "marie@garage.fr",
      password: "motdepasse123",
      role: "mechanic",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = createUserSchema.safeParse({
      firstName: "Marie",
      lastName: "Dupont",
      email: "marie@garage.fr",
      password: "motdepasse123",
      role: "admin",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid roles", () => {
    for (const role of ["manager", "mechanic", "secretary"]) {
      const result = createUserSchema.safeParse({
        firstName: "Jo",
        lastName: "Bo",
        email: "jo@garage.fr",
        password: "12345678",
        role,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("updateUserSchema", () => {
  it("accepts partial data", () => {
    const result = updateUserSchema.safeParse({ firstName: "Pierre" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

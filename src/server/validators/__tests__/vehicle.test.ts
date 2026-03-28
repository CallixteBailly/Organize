import { describe, it, expect } from "vitest";
import { createVehicleSchema, updateVehicleSchema } from "../vehicle";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

describe("createVehicleSchema", () => {
  it("accepts valid vehicle", () => {
    const result = createVehicleSchema.safeParse({
      customerId: validUuid,
      licensePlate: "AB-123-CD",
      brand: "Renault",
      model: "Clio",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.licensePlate).toBe("AB123CD");
    }
  });

  it("normalizes license plate (uppercase, no spaces/dashes)", () => {
    const result = createVehicleSchema.safeParse({
      customerId: validUuid,
      licensePlate: "ab-123-cd",
      brand: "Peugeot",
      model: "208",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.licensePlate).toBe("AB123CD");
    }
  });

  it("rejects missing brand", () => {
    const result = createVehicleSchema.safeParse({
      customerId: validUuid,
      licensePlate: "AB-123-CD",
      model: "Clio",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing customerId", () => {
    const result = createVehicleSchema.safeParse({
      licensePlate: "AB-123-CD",
      brand: "Renault",
      model: "Clio",
    });
    expect(result.success).toBe(false);
  });

  it("coerces year and mileage from strings", () => {
    const result = createVehicleSchema.safeParse({
      customerId: validUuid,
      licensePlate: "XX-999-YY",
      brand: "Toyota",
      model: "Yaris",
      year: "2020",
      mileage: "45000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe(2020);
      expect(result.data.mileage).toBe(45000);
    }
  });

  it("rejects unrealistic year", () => {
    const result = createVehicleSchema.safeParse({
      customerId: validUuid,
      licensePlate: "XX-999-YY",
      brand: "Toyota",
      model: "Yaris",
      year: "1800",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateVehicleSchema", () => {
  it("accepts partial update", () => {
    const result = updateVehicleSchema.safeParse({
      mileage: "50000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mileage).toBe(50000);
    }
  });

  it("does not require customerId", () => {
    const result = updateVehicleSchema.safeParse({
      brand: "Citroen",
    });
    expect(result.success).toBe(true);
  });
});

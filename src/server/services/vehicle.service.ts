import { eq, and, or, ilike, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";
import type { CreateVehicleInput, UpdateVehicleInput } from "@/server/validators/vehicle";

export async function getVehiclesByCustomer(garageId: string, customerId: string) {
  return db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.customerId, customerId), eq(vehicles.garageId, garageId)))
    .orderBy(desc(vehicles.updatedAt));
}

export async function getVehicleById(garageId: string, vehicleId: string) {
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.garageId, garageId)))
    .limit(1);
  return vehicle ?? null;
}

export async function searchVehicleByPlate(garageId: string, plate: string) {
  const normalized = plate.toUpperCase().replace(/[\s-]/g, "");
  return db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.garageId, garageId), eq(vehicles.licensePlate, normalized)))
    .limit(5);
}

export async function searchVehicles(garageId: string, query: string) {
  const pattern = `%${query}%`;
  return db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.garageId, garageId),
        or(
          ilike(vehicles.licensePlate, pattern),
          ilike(vehicles.vin, pattern),
          ilike(vehicles.brand, pattern),
          ilike(vehicles.model, pattern),
        ),
      ),
    )
    .limit(20);
}

export async function createVehicle(garageId: string, data: CreateVehicleInput) {
  const [vehicle] = await db
    .insert(vehicles)
    .values({ ...data, garageId })
    .returning();
  return vehicle;
}

export async function updateVehicle(
  garageId: string,
  vehicleId: string,
  data: UpdateVehicleInput,
) {
  const [updated] = await db
    .update(vehicles)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.garageId, garageId)))
    .returning();
  return updated;
}

import { eq, and, or, ilike, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";
import type { CreateVehicleInput, UpdateVehicleInput } from "@/server/validators/vehicle";
import type { CatalogVehicle } from "@/lib/catalog/types";

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

/**
 * Enrichit un véhicule existant avec les données identifiées par L'Argus (ou autre provider).
 * Ne met à jour que les champs vides — ne remplace jamais une valeur déjà saisie par le garage.
 */
export async function enrichVehicleFromCatalog(
  garageId: string,
  vehicleId: string,
  catalog: CatalogVehicle,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.garageId, garageId)))
    .limit(1);

  if (!existing) return;

  const patch: Partial<typeof vehicles.$inferInsert> = {};

  if (!existing.brand && catalog.make) patch.brand = catalog.make;
  if (!existing.model && catalog.model) patch.model = catalog.model;
  if (!existing.year && catalog.year) patch.year = catalog.year;
  if (!existing.engineType && catalog.fuelType) patch.engineType = catalog.fuelType;
  if (!existing.kTypeId && catalog.kTypeId) patch.kTypeId = catalog.kTypeId;

  if (Object.keys(patch).length === 0) return; // Rien à mettre à jour

  await db
    .update(vehicles)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.garageId, garageId)));
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

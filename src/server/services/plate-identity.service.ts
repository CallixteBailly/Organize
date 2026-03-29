import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { plateIdentity } from "@/lib/db/schema";
import type { CatalogVehicle } from "@/lib/catalog/types";
import type { PlateIdentityRow } from "@/lib/db/schema/plate-identity";

function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[\s-]/g, "");
}

/**
 * Récupère l'identité véhicule depuis la table plate_identity.
 * Retourne null si la plaque n'a jamais été cherchée.
 */
export async function getPlateIdentity(plate: string): Promise<PlateIdentityRow | null> {
  const normalized = normalizePlate(plate);
  const [row] = await db
    .select()
    .from(plateIdentity)
    .where(eq(plateIdentity.plate, normalized))
    .limit(1);
  return row ?? null;
}

/**
 * Insère ou met à jour l'identité d'une plaque dans la table globale.
 * Appelé automatiquement après un appel L'Argus réussi.
 */
export async function upsertPlateIdentity(
  plate: string,
  vehicle: CatalogVehicle,
  provider: string,
): Promise<void> {
  const normalized = normalizePlate(plate);

  await db
    .insert(plateIdentity)
    .values({
      plate: normalized,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year ?? undefined,
      fuelType: vehicle.fuelType ?? undefined,
      engineCode: vehicle.engineCode ?? undefined,
      displacement: vehicle.displacement ?? undefined,
      kTypeId: vehicle.kTypeId,
      provider,
      fetchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: plateIdentity.plate,
      set: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year ?? undefined,
        fuelType: vehicle.fuelType ?? undefined,
        engineCode: vehicle.engineCode ?? undefined,
        displacement: vehicle.displacement ?? undefined,
        kTypeId: vehicle.kTypeId,
        provider,
        fetchedAt: new Date(),
      },
    });
}

/**
 * Convertit une ligne plate_identity en CatalogVehicle
 * pour alimenter le cache Redis et la réponse API.
 */
export function plateIdentityToCatalogVehicle(row: PlateIdentityRow): CatalogVehicle {
  return {
    kTypeId: row.kTypeId ?? 0,
    make: row.make ?? "Inconnu",
    model: row.model ?? "Inconnu",
    year: row.year,
    fuelType: row.fuelType,
    engineCode: row.engineCode,
    displacement: row.displacement,
  };
}

import { getCatalogConfig } from "./config";
import { getCachedVehicle, setCachedVehicle, getCachedParts, setCachedParts } from "./cache";
import { MockCatalogProvider } from "./providers/mock.provider";
import { TecDocProvider } from "./providers/tecdoc.provider";
import { HistovecProvider, type HistovecParams } from "./providers/histovec.provider";
import { CatalogDisabledError } from "./errors";
import type { IVehicleCatalogProvider, CatalogVehicle, CatalogCategory } from "./types";

export * from "./types";
export * from "./errors";
export * from "./config";
export type { HistovecParams } from "./providers/histovec.provider";

function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[\s-]/g, "");
}

let _provider: IVehicleCatalogProvider | null = null;

function getProvider(): IVehicleCatalogProvider {
  if (_provider) return _provider;

  const config = getCatalogConfig();

  if (config.provider === "histovec") {
    _provider = new HistovecProvider();
  } else if (config.provider === "tecdoc") {
    _provider = new TecDocProvider(
      config.tecdocApiKey ?? "",
      config.tecdocApiUrl,
      config.tecdocProviderId ?? "",
    );
  } else {
    _provider = new MockCatalogProvider();
  }

  return _provider;
}

export function resetProvider(): void {
  _provider = null;
}

/**
 * Résout une plaque.
 * histovecParams requis si CATALOG_PROVIDER=histovec (formule + nom du titulaire).
 */
export async function resolvePlateWithCache(
  rawPlate: string,
  histovecParams?: HistovecParams,
): Promise<CatalogVehicle | null> {
  const config = getCatalogConfig();
  if (!config.enabled) throw new CatalogDisabledError();

  const plate = normalizePlate(rawPlate);

  // Cache keyed par plaque + formule pour éviter les collisions entre véhicules différents
  const cacheKey = histovecParams?.formule ? `${plate}:${histovecParams.formule}` : plate;
  const cached = await getCachedVehicle(cacheKey);
  if (cached) return cached;

  const provider = getProvider();

  // HistovecProvider accepte un second paramètre
  const vehicle =
    provider instanceof HistovecProvider
      ? await provider.resolveVehicleByPlate(plate, histovecParams)
      : await provider.resolveVehicleByPlate(plate);

  if (vehicle) {
    await setCachedVehicle(cacheKey, vehicle, config.cacheTtlVehicle);
  }

  return vehicle;
}

export async function getPartsWithCache(kTypeId: number): Promise<CatalogCategory[]> {
  const config = getCatalogConfig();
  if (!config.enabled) throw new CatalogDisabledError();

  const cached = await getCachedParts(kTypeId);
  if (cached) return cached;

  const provider = getProvider();
  const categories = await provider.getPartsByVehicle(kTypeId);

  if (categories.length > 0) {
    await setCachedParts(kTypeId, categories, config.cacheTtlParts);
  }

  return categories;
}

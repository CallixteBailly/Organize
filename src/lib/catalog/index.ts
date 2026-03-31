import { getCatalogConfig } from "./config";
import { getCachedVehicle, setCachedVehicle, getCachedParts, setCachedParts } from "./cache";
import { MockCatalogProvider } from "./providers/mock.provider";
import { TecDocProvider } from "./providers/tecdoc.provider";
import { HistovecProvider, type HistovecParams } from "./providers/histovec.provider";
import { LargusProvider } from "./providers/largus.provider";
import { CustomApiProvider } from "./providers/custom-api.provider";
import { CatalogDisabledError } from "./errors";
import type { IVehicleCatalogProvider, CatalogVehicle, CatalogCategory, VehicleModelSearchParams } from "./types";
import {
  getPlateIdentity,
  upsertPlateIdentity,
  plateIdentityToCatalogVehicle,
} from "@/server/services/plate-identity.service";

export * from "./types";
export * from "./errors";
export * from "./config";
export type { HistovecParams } from "./providers/histovec.provider";

function modelToKTypeId(make: string, model: string, year?: number): number {
  const str = `${make.toLowerCase()}:${model.toLowerCase()}:${year ?? 0}`;
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash ^ str.charCodeAt(i)) >>> 0;
  }
  return (hash % 900000) + 100000;
}

function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[\s-]/g, "");
}

let _vehicleProvider: LargusProvider | HistovecProvider | MockCatalogProvider | null = null;
let _partsProvider: IVehicleCatalogProvider | null = null;

function getProviders(): {
  vehicle: LargusProvider | HistovecProvider | MockCatalogProvider;
  parts: IVehicleCatalogProvider;
} {
  const config = getCatalogConfig();

  if (!_vehicleProvider) {
    if (config.provider === "histovec") {
      _vehicleProvider = new HistovecProvider();
    } else if (config.provider === "mock") {
      _vehicleProvider = new MockCatalogProvider();
    } else {
      _vehicleProvider = new LargusProvider();
    }
  }

  if (!_partsProvider) {
    if (config.provider === "custom" || (config.customApiUrl && config.customApiKey)) {
      _partsProvider = new CustomApiProvider(
        config.customApiUrl ?? "http://72.62.179.53:4000",
        config.customApiKey ?? "",
      );
    } else if (config.provider === "tecdoc") {
      _partsProvider = new TecDocProvider(
        config.tecdocApiKey ?? "",
        config.tecdocApiUrl,
        config.tecdocProviderId ?? "",
      );
    } else if (config.provider === "mock") {
      _partsProvider = new MockCatalogProvider();
    } else {
      // largus / histovec → mock pour les pièces (L'Argus ne fournit pas de catalogue)
      _partsProvider = new MockCatalogProvider();
    }
  }

  return { vehicle: _vehicleProvider, parts: _partsProvider };
}

export function resetProvider(): void {
  _vehicleProvider = null;
  _partsProvider = null;
}

/**
 * Résout une plaque en 3 niveaux :
 *   1. Redis        (24h)       — ultra-rapide
 *   2. plate_identity DB        — permanent, pas de quota
 *   3. L'Argus API              — sauvegarde dans DB + Redis
 */
export async function resolvePlateWithCache(
  rawPlate: string,
  histovecParams?: HistovecParams,
  clientIp?: string,
): Promise<CatalogVehicle | null> {
  const config = getCatalogConfig();
  if (!config.enabled) throw new CatalogDisabledError();

  const plate = normalizePlate(rawPlate);
  const cacheKey = histovecParams?.formule ? `${plate}:${histovecParams.formule}` : plate;

  // ── Niveau 1 : Redis ──────────────────────────────────────────────────────
  const redisHit = await getCachedVehicle(cacheKey);
  if (redisHit) return redisHit;

  // ── Niveau 2 : plate_identity (DB) ────────────────────────────────────────
  if (!histovecParams) {
    try {
      const dbRow = await getPlateIdentity(plate);
      if (dbRow) {
        const vehicle = plateIdentityToCatalogVehicle(dbRow);
        await setCachedVehicle(cacheKey, vehicle, config.cacheTtlVehicle);
        return vehicle;
      }
    } catch (err) {
      console.warn("[catalog] plate_identity lookup échoué:", err);
    }
  }

  // ── Niveau 3 : API externe ────────────────────────────────────────────────
  const { vehicle: vehicleProvider } = getProviders();

  const vehicle =
    vehicleProvider instanceof HistovecProvider
      ? await vehicleProvider.resolveVehicleByPlate(plate, histovecParams)
      : vehicleProvider instanceof MockCatalogProvider
      ? await vehicleProvider.resolveVehicleByPlate(plate)
      : await vehicleProvider.resolveVehicleByPlate(plate, clientIp);

  if (vehicle) {
    await setCachedVehicle(cacheKey, vehicle, config.cacheTtlVehicle);

    if (!histovecParams) {
      upsertPlateIdentity(plate, vehicle, config.provider).catch((err) => {
        console.error("[catalog] upsertPlateIdentity échoué:", err);
      });
    }
  }

  return vehicle;
}

/**
 * Resolves a vehicle from make/model/year params.
 * Tries the provider's searchVehiclesByModel; falls back to a synthetic vehicle
 * built from the provided params so that parts lookup still works.
 */
export async function resolveVehicleByModel(
  params: VehicleModelSearchParams,
): Promise<CatalogVehicle | null> {
  const config = getCatalogConfig();
  if (!config.enabled) throw new CatalogDisabledError();

  const cacheKey = `model:${params.make.toLowerCase().replace(/\s+/g, "_")}:${params.model.toLowerCase().replace(/\s+/g, "_")}:${params.year ?? "0"}:${params.fuelType ?? "any"}`;

  const cached = await getCachedVehicle(cacheKey);
  if (cached) return cached;

  const { vehicle: vehicleProvider, parts: partsProvider } = getProviders();

  let vehicle: CatalogVehicle | null = null;

  // Essayer d'abord le partsProvider (CustomApiProvider a searchVehiclesByModel avec 82k+ variantes)
  if ("searchVehiclesByModel" in partsProvider && partsProvider.searchVehiclesByModel) {
    const results = await partsProvider.searchVehiclesByModel(params);
    vehicle = results[0] ?? null;
  }

  // Fallback: vehicleProvider (L'Argus / Mock)
  if (!vehicle && "searchVehiclesByModel" in vehicleProvider && vehicleProvider.searchVehiclesByModel) {
    const results = await vehicleProvider.searchVehiclesByModel(params);
    vehicle = results[0] ?? null;
  }

  // Fallback: synthetic vehicle from the provided params
  if (!vehicle) {
    vehicle = {
      kTypeId: modelToKTypeId(params.make, params.model, params.year),
      make: params.make,
      model: params.model,
      year: params.year ?? null,
      engineCode: null,
      fuelType: params.fuelType ?? null,
      displacement: null,
    };
  }

  await setCachedVehicle(cacheKey, vehicle, config.cacheTtlVehicle);
  return vehicle;
}

/**
 * Récupère les pièces compatibles pour un véhicule.
 * Le CustomApiProvider utilise make/model (depuis plate_identity) pour filtrer.
 */
export async function getPartsWithCache(
  kTypeId: number,
  make?: string,
  model?: string,
): Promise<CatalogCategory[]> {
  const config = getCatalogConfig();
  if (!config.enabled) throw new CatalogDisabledError();

  // Clé de cache : par kTypeId (stable par véhicule)
  const cached = await getCachedParts(kTypeId);
  if (cached) return cached;

  const { parts } = getProviders();

  // CustomApiProvider a besoin de make/model pour filtrer ses articles
  const categories =
    parts instanceof CustomApiProvider
      ? await parts.getPartsByVehicle(kTypeId, make, model)
      : await parts.getPartsByVehicle(kTypeId);

  if (categories.length > 0) {
    await setCachedParts(kTypeId, categories, config.cacheTtlParts);
  }

  return categories;
}

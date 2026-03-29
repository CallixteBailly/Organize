import { getCatalogConfig } from "./config";
import { getCachedVehicle, setCachedVehicle, getCachedParts, setCachedParts } from "./cache";
import { MockCatalogProvider } from "./providers/mock.provider";
import { TecDocProvider } from "./providers/tecdoc.provider";
import { HistovecProvider, type HistovecParams } from "./providers/histovec.provider";
import { LargusProvider } from "./providers/largus.provider";
import { CatalogDisabledError } from "./errors";
import type { IVehicleCatalogProvider, CatalogVehicle, CatalogCategory } from "./types";
import {
  getPlateIdentity,
  upsertPlateIdentity,
  plateIdentityToCatalogVehicle,
} from "@/server/services/plate-identity.service";

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

  if (config.provider === "largus") {
    _provider = new LargusProvider();
  } else if (config.provider === "histovec") {
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
 * Résout une plaque en 3 niveaux :
 *   1. Redis        (24h)       — ultra-rapide
 *   2. plate_identity DB        — permanent, pas de quota
 *   3. API externe (L'Argus…)  — sauvegarde dans DB + Redis
 *
 * histovecParams requis si CATALOG_PROVIDER=histovec.
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
  // Uniquement pour les providers sans données personnelles (largus, mock)
  // Histovec est lié à un titulaire spécifique → pas de cache global DB
  if (!histovecParams) {
    try {
      const dbRow = await getPlateIdentity(plate);
      if (dbRow) {
        const vehicle = plateIdentityToCatalogVehicle(dbRow);
        await setCachedVehicle(cacheKey, vehicle, config.cacheTtlVehicle);
        return vehicle;
      }
    } catch (err) {
      console.warn("[catalog] plate_identity lookup échoué (DB indisponible?):", err);
      // Non bloquant — on continue vers l'API externe
    }
  }

  // ── Niveau 3 : API externe ────────────────────────────────────────────────
  const provider = getProvider();

  const vehicle =
    provider instanceof HistovecProvider
      ? await provider.resolveVehicleByPlate(plate, histovecParams)
      : provider instanceof LargusProvider
        ? await provider.resolveVehicleByPlate(plate, clientIp)
        : await provider.resolveVehicleByPlate(plate);

  if (vehicle) {
    // Sauvegarde dans Redis
    await setCachedVehicle(cacheKey, vehicle, config.cacheTtlVehicle);

    // Sauvegarde dans plate_identity (sauf histovec — données liées à un titulaire)
    if (!histovecParams) {
      upsertPlateIdentity(plate, vehicle, config.provider).catch((err) => {
        console.error("[catalog] upsertPlateIdentity échoué:", err);
      });
    }
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

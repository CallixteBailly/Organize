import { getCatalogConfig } from "./config";
import { getCachedVehicle, setCachedVehicle, getCachedParts, setCachedParts } from "./cache";
import { SivProvider } from "./providers/siv.provider";
import { MockCatalogProvider } from "./providers/mock.provider";
import { TecDocProvider } from "./providers/tecdoc.provider";
import { AutoDocProvider } from "./providers/autodoc.provider";
import { CatalogDisabledError, CatalogProviderError } from "./errors";
import type { IVehicleCatalogProvider, CatalogVehicle, CatalogCategory } from "./types";

export * from "./types";
export * from "./errors";
export * from "./config";

function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[\s-]/g, "");
}

let _provider: IVehicleCatalogProvider | null = null;

function getProvider(): IVehicleCatalogProvider {
  if (_provider) return _provider;

  const config = getCatalogConfig();

  if (config.provider === "autodoc") {
    // Les cookies sont gérés automatiquement par CloudflareSessionManager (stratégie cloudscraper)
    // AUTODOC_COOKIES / AUTODOC_CSRF_TOKEN optionnels — remplacent le premier bootstrap Playwright
    _provider = new AutoDocProvider();
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

// Permet de réinitialiser le provider (ex: après mise à jour des cookies)
export function resetProvider(): void {
  _provider = null;
}

export async function resolvePlateWithCache(rawPlate: string): Promise<CatalogVehicle | null> {
  const config = getCatalogConfig();
  if (!config.enabled) throw new CatalogDisabledError();

  const plate = normalizePlate(rawPlate);

  const cached = await getCachedVehicle(plate);
  if (cached) return cached;

  const provider = getProvider();
  const vehicle = await provider.resolveVehicleByPlate(plate);

  if (vehicle) {
    await setCachedVehicle(plate, vehicle, config.cacheTtlVehicle);
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

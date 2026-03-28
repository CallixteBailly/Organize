export interface CatalogConfig {
  provider: "mock" | "tecdoc" | "histovec" | "largus";
  // TecDoc B2B
  tecdocApiKey: string | null;
  tecdocApiUrl: string;
  tecdocProviderId: string | null;
  cacheTtlVehicle: number;
  cacheTtlParts: number;
  enabled: boolean;
}

let _config: CatalogConfig | undefined;

export function getCatalogConfig(): CatalogConfig {
  if (_config) return _config;

  _config = {
    provider: (process.env.CATALOG_PROVIDER as "mock" | "tecdoc" | "histovec" | "largus") ?? "mock",
    tecdocApiKey: process.env.TECDOC_API_KEY ?? null,
    tecdocApiUrl:
      process.env.TECDOC_API_URL ??
      "https://webservice.tecalliance.services/pegasus-3-0/services/TecdocToCatDLW",
    tecdocProviderId: process.env.TECDOC_PROVIDER_ID ?? null,
    cacheTtlVehicle: Number(process.env.CATALOG_CACHE_TTL_VEHICLE) || 86400,
    cacheTtlParts: Number(process.env.CATALOG_CACHE_TTL_PARTS) || 3600,
    enabled: process.env.CATALOG_ENABLED !== "false",
  };

  return _config;
}

export function resetCatalogConfig(): void {
  _config = undefined;
}

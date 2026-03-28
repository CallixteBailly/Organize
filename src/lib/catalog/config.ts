export interface CatalogConfig {
  provider: "mock" | "tecdoc" | "autodoc";
  // SIV (lookup plaque → véhicule, utilisé hors autodoc)
  immatApiKey: string | null;
  immatApiUrl: string;
  // TecDoc B2B
  tecdocApiKey: string | null;
  tecdocApiUrl: string;
  tecdocProviderId: string | null;
  // Auto-doc.fr (cookies Cloudflare + token CSRF depuis le navigateur)
  autodocCookies: string | null;
  autodocCsrfToken: string | null;
  cacheTtlVehicle: number;
  cacheTtlParts: number;
  enabled: boolean;
}

let _config: CatalogConfig | undefined;

export function getCatalogConfig(): CatalogConfig {
  if (_config) return _config;

  _config = {
    provider: (process.env.CATALOG_PROVIDER as "mock" | "tecdoc" | "autodoc") ?? "mock",
    immatApiKey: process.env.IMMAT_API_KEY ?? null,
    immatApiUrl: process.env.IMMAT_API_URL ?? "https://api-immat.fr/v1",
    tecdocApiKey: process.env.TECDOC_API_KEY ?? null,
    tecdocApiUrl:
      process.env.TECDOC_API_URL ??
      "https://webservice.tecalliance.services/pegasus-3-0/services/TecdocToCatDLW",
    tecdocProviderId: process.env.TECDOC_PROVIDER_ID ?? null,
    autodocCookies: process.env.AUTODOC_COOKIES ?? null,
    autodocCsrfToken: process.env.AUTODOC_CSRF_TOKEN ?? null,
    cacheTtlVehicle: Number(process.env.CATALOG_CACHE_TTL_VEHICLE) || 86400,
    cacheTtlParts: Number(process.env.CATALOG_CACHE_TTL_PARTS) || 3600,
    enabled: process.env.CATALOG_ENABLED !== "false",
  };

  return _config;
}

export function resetCatalogConfig(): void {
  _config = undefined;
}

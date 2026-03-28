import type { IVehicleCatalogProvider, CatalogVehicle, CatalogCategory, CatalogPart } from "../types";
import { CatalogProviderError } from "../errors";
import { getAutoDocSession, invalidateSession } from "../cloudflare-session";

const BASE_URL = "https://www.auto-doc.fr";

// ─── Types réponses auto-doc ──────────────────────────────────────────────────

interface AutoDocVehicleOption {
  id?: number | string;
  vehicleId?: number | string;
  makeId?: number;
  makeName?: string;
  modelName?: string;
  name?: string;
  label?: string;
  slug?: string;
  link?: string;
  year_from?: number | string;
  year_to?: number | string;
  yearFrom?: number | string;
  yearTo?: number | string;
  fuelType?: string;
  engineType?: string;
  ccm?: number | string;
}

interface AutoDocSearchResponse {
  vehicles?: AutoDocVehicleOption[];
  items?: AutoDocVehicleOption[];
  options?: AutoDocVehicleOption[];
  content?: unknown;
  html?: string;
  // Fallback : clé inconnue — on log tout
  [key: string]: unknown;
}

interface AutoDocCategory {
  id?: number | string;
  nodeId?: number | string;
  name?: string;
  label?: string;
  count?: number;
  assemblyGroupNodeId?: number | string;
}

interface AutoDocPart {
  id?: number | string;
  articleId?: string;
  articleNumber?: string;
  reference?: string;
  name?: string;
  title?: string;
  brand?: string;
  brandName?: string;
  manufacturer?: string;
  description?: string;
  oemNumbers?: string[];
  oem?: string[];
}

interface AutoDocPartsResponse {
  categories?: AutoDocCategory[];
  parts?: AutoDocPart[];
  articles?: AutoDocPart[];
  items?: AutoDocPart[];
  [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPlateForAutoDoc(plate: string): string {
  // auto-doc accepte FG-533-LT (avec tirets)
  const normalized = plate.toUpperCase().replace(/[\s-]/g, "");
  if (normalized.length === 7) {
    return `${normalized.slice(0, 2)}-${normalized.slice(2, 5)}-${normalized.slice(5)}`;
  }
  return plate.toUpperCase();
}

function extractYear(raw: number | string | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(String(raw), 10);
  return isNaN(n) ? null : n;
}

function extractModelIdFromSlug(slug?: string, link?: string): number | null {
  // Extrait l'ID numérique depuis "/renault/clio-iv-906/" → 906
  const src = link ?? slug ?? "";
  const match = src.match(/-(\d+)\/?$/);
  return match ? parseInt(match[1], 10) : null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class AutoDocProvider implements IVehicleCatalogProvider {
  // Pas de constructor — la session est gérée par CloudflareSessionManager

  private buildHeaders(cookies: string, csrfToken: string): Record<string, string> {
    return {
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language": "fr,fr-FR;q=0.9,en;q=0.8",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      cookie: cookies,
      origin: BASE_URL,
      pragma: "no-cache",
      referer: `${BASE_URL}/`,
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "x-csrf-token": csrfToken,
      "x-requested-with": "XMLHttpRequest",
    };
  }

  /**
   * Exécute une requête POST avec retry automatique sur 403.
   * Stratégie cloudscraper : si bloqué, relance Chromium headless
   * pour résoudre le challenge Cloudflare, puis réessaie.
   */
  private async postWithRetry(
    url: string,
    body: URLSearchParams,
    attempt = 1,
  ): Promise<Response> {
    const session = await getAutoDocSession();
    const headers = this.buildHeaders(session.cookies, session.csrfToken);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers,
        body: body.toString(),
        signal: controller.signal,
        cache: "no-store",
      });
    } finally {
      clearTimeout(timeout);
    }

    // Cloudflare a bloqué → invalide la session et réessaie une fois (stratégie cloudscraper)
    if (res.status === 403 && attempt === 1) {
      console.warn("[AutoDoc] 403 — invalidation session et retry via Chromium headless…");
      invalidateSession();
      return this.postWithRetry(url, body, 2);
    }

    return res;
  }

  private async getWithRetry(url: string, attempt = 1): Promise<Response> {
    const session = await getAutoDocSession();
    const headers = this.buildHeaders(session.cookies, session.csrfToken);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { ...headers, "content-type": "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 403 && attempt === 1) {
      console.warn("[AutoDoc GET] 403 — retry via Chromium headless…");
      invalidateSession();
      return this.getWithRetry(url, 2);
    }

    return res;
  }

  async resolveVehicleByPlate(plate: string): Promise<CatalogVehicle | null> {
    const formattedPlate = formatPlateForAutoDoc(plate);

    const body = new URLSearchParams();
    body.append("kba[]", formattedPlate);
    body.append("route", "main");
    body.append("eventObject", "block");

    try {
      const res = await this.postWithRetry(
        `${BASE_URL}/ajax/selector/vehicle/search-number`,
        body,
      );

      if (!res.ok) {
        throw new CatalogProviderError(`Auto-doc erreur HTTP ${res.status}`);
      }

      const data: AutoDocSearchResponse = await res.json();

      if (process.env.NODE_ENV !== "production") {
        console.log("[AutoDoc search-number raw]", JSON.stringify(data, null, 2).slice(0, 2000));
      }

      return this.parseVehicle(data, plate);
    } catch (err) {
      if (err instanceof CatalogProviderError) throw err;
      if ((err as Error).name === "AbortError") {
        throw new CatalogProviderError("Délai dépassé — auto-doc ne répond pas");
      }
      throw new CatalogProviderError(`Erreur auto-doc: ${(err as Error).message}`);
    }
  }

  private parseVehicle(data: AutoDocSearchResponse, plate: string): CatalogVehicle | null {
    // auto-doc peut retourner les véhicules sous différentes clés selon la version
    const candidates: AutoDocVehicleOption[] =
      data.vehicles ?? data.items ?? data.options ?? [];

    // Parfois imbriqué dans data.content
    if (candidates.length === 0 && data.content && typeof data.content === "object") {
      const content = data.content as Record<string, unknown>;
      const nested =
        (content.vehicles as AutoDocVehicleOption[]) ??
        (content.items as AutoDocVehicleOption[]) ??
        [];
      candidates.push(...nested);
    }

    if (candidates.length === 0) {
      console.warn("[AutoDoc] Aucun véhicule trouvé dans la réponse pour", plate);
      return null;
    }

    // On prend le premier résultat (le plus pertinent)
    const v = candidates[0];

    const slug = v.slug ?? v.link ?? "";
    const modelId = extractModelIdFromSlug(slug, v.link);
    const kTypeId = modelId ?? (typeof v.id === "number" ? v.id : parseInt(String(v.id ?? "0"), 10));

    return {
      kTypeId,
      make: v.makeName ?? v.name?.split(" ")[0] ?? "Inconnu",
      model:
        v.modelName ??
        v.label ??
        v.name?.replace(/^[^\s]+ /, "") ??
        "Inconnu",
      year: extractYear(v.year_from ?? v.yearFrom),
      engineCode: null,
      fuelType: v.fuelType ?? v.engineType ?? null,
      displacement: v.ccm ? parseInt(String(v.ccm), 10) || null : null,
    };
  }

  async getPartsByVehicle(kTypeId: number): Promise<CatalogCategory[]> {
    // Essaie d'abord l'endpoint AJAX des catégories
    const categories = await this.fetchCategories(kTypeId);
    if (categories.length > 0) return categories;

    // Fallback : retourne les catégories mock si l'API ne répond pas encore
    console.warn(
      "[AutoDoc] Endpoint parts non résolu pour kTypeId", kTypeId,
      "— utilisez les logs debug pour trouver le bon endpoint",
    );
    return [];
  }

  private async fetchCategories(vehicleId: number): Promise<CatalogCategory[]> {
    const endpoints = [
      `/ajax/catalog/categories?vehicleId=${vehicleId}`,
      `/ajax/catalog/parts?vehicleId=${vehicleId}`,
      `/ajax/selector/vehicle/categories?id=${vehicleId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await this.getWithRetry(`${BASE_URL}${endpoint}`);
        if (!res.ok) continue;

        const data: AutoDocPartsResponse = await res.json();

        if (process.env.NODE_ENV !== "production") {
          console.log(`[AutoDoc ${endpoint} raw]`, JSON.stringify(data, null, 2).slice(0, 2000));
        }

        const result = this.parseCategories(data);
        if (result.length > 0) return result;
      } catch {
        // Essai endpoint suivant
      }
    }

    return [];
  }

  private parseCategories(data: AutoDocPartsResponse): CatalogCategory[] {
    const raw: AutoDocCategory[] = data.categories ?? (data.items as AutoDocCategory[]) ?? [];

    return raw
      .map((cat) => ({
        id: String(cat.id ?? cat.nodeId ?? cat.assemblyGroupNodeId ?? ""),
        name: cat.name ?? cat.label ?? "Catégorie",
        parts: [] as CatalogPart[],
      }))
      .filter((c) => c.id !== "");
  }
}

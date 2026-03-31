/**
 * CustomApiProvider — Catalogue pièces via l'API TecDoc interne (organize-api)
 * Base : 558k+ articles avec compatibilité véhicule, groupés par catégorie.
 *
 * Stratégie :
 * 1. Recherche de véhicules par marque/modèle → retourne les carTypeIds (kTypeId)
 * 2. Pour un carTypeId donné, récupère les pièces groupées par catégorie côté serveur
 * 3. Plus de chargement client-side de tous les articles
 */

import type { IVehicleCatalogProvider, CatalogVehicle, CatalogCategory, VehicleModelSearchParams } from "../types";
import { CatalogProviderError } from "../errors";

// ─── Types API organize-api ──────────────────────────────────────────────────

interface ApiVehicleResult {
  kTypeId: number;
  make: string;
  model: string;
  variant: string;
  year: number | null;
  engineCode: string | null;
  fuelType: string | null;
  displacement: number | null;
  powerKw: number | null;
  productionStart: string | null;
  productionEnd: string | null;
}

interface ApiPartsByVehicleResponse {
  vehicle: {
    carTypeId: number;
    name: string;
    model: string;
    manufacturer: string;
    fuelType: string | null;
    engineCc: number | null;
    powerKw: number | null;
    productionStart: string | null;
    productionEnd: string | null;
  } | null;
  categories: Array<{
    id: string;
    name: string;
    parts: Array<{
      articleId: string;
      reference: string;
      name: string;
      brand: string;
      description: string | null;
      oemNumbers: string[];
    }>;
  }>;
  total: number;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export class CustomApiProvider implements IVehicleCatalogProvider {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  private async fetch<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const url = `${this.apiUrl}${path}`;
      const res = await fetch(url, {
        headers: {
          "X-API-Key": this.apiKey,
          Accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        throw new CatalogProviderError(`API pièces erreur ${res.status}: ${await res.text()}`);
      }

      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof CatalogProviderError) throw err;
      if ((err as Error).name === "AbortError") {
        throw new CatalogProviderError("Délai dépassé — API pièces ne répond pas");
      }
      throw new CatalogProviderError(`Erreur API pièces: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Résolution véhicule non gérée ici — L'Argus s'en charge */
  async resolveVehicleByPlate(_plate: string): Promise<CatalogVehicle | null> {
    return null;
  }

  /**
   * Récupère les pièces compatibles groupées par catégorie.
   * Utilise le carTypeId (= kTypeId TecDoc) pour une requête ciblée côté serveur.
   * Fallback : recherche par marque/modèle si kTypeId inconnu.
   */
  async getPartsByVehicle(kTypeId: number, make?: string, model?: string): Promise<CatalogCategory[]> {
    // Stratégie 1 : requête directe par carTypeId (le plus efficace)
    if (kTypeId > 0) {
      try {
        const data = await this.fetch<ApiPartsByVehicleResponse>(
          `/api/catalog/parts-by-vehicle/${kTypeId}`,
        );
        return data.categories;
      } catch {
        // Si le carTypeId n'est pas trouvé, tenter par marque/modèle
      }
    }

    // Stratégie 2 : recherche par marque/modèle → trouver le carTypeId → récupérer les pièces
    if (make && model) {
      const modelBase = model.split(" ")[0];
      const vehicles = await this.fetch<{ data: ApiVehicleResult[] }>(
        `/api/catalog/search-vehicles?make=${encodeURIComponent(make)}&model=${encodeURIComponent(modelBase)}&limit=1`,
      );

      if (vehicles.data.length > 0) {
        const foundKTypeId = vehicles.data[0].kTypeId;
        const data = await this.fetch<ApiPartsByVehicleResponse>(
          `/api/catalog/parts-by-vehicle/${foundKTypeId}`,
        );
        return data.categories;
      }
    }

    return [];
  }

  /**
   * Recherche de véhicules par marque/modèle/année/carburant.
   * Utilise l'endpoint search-vehicles de l'API.
   */
  async searchVehiclesByModel(params: VehicleModelSearchParams): Promise<CatalogVehicle[]> {
    const qs = new URLSearchParams();
    qs.set("make", params.make);
    if (params.model) qs.set("model", params.model);
    if (params.year) qs.set("year", String(params.year));
    if (params.fuelType) qs.set("fuelType", params.fuelType);
    qs.set("limit", "20");

    const data = await this.fetch<{ data: ApiVehicleResult[] }>(
      `/api/catalog/search-vehicles?${qs.toString()}`,
    );

    return data.data.map((v) => {
      // Le model TecDoc contient souvent le fabricant en préfixe (ex: "PEUGEOT 208 Camionnette")
      // On le retire pour éviter la duplication "PEUGEOT PEUGEOT 208..."
      let cleanModel = v.model;
      if (cleanModel.toUpperCase().startsWith(v.make.toUpperCase())) {
        cleanModel = cleanModel.slice(v.make.length).trim();
      }
      return {
        kTypeId: v.kTypeId,
        make: v.make,
        model: cleanModel,
        year: v.year,
        engineCode: v.engineCode,
        fuelType: v.fuelType,
        displacement: v.displacement,
        variant: v.variant || null,
        powerKw: v.powerKw,
      };
    });
  }
}

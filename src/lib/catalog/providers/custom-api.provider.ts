/**
 * CustomApiProvider — Catalogue pièces via l'API TecDoc interne
 * Base : 647 articles avec véhicules compatibles, specs et références OEM.
 *
 * Stratégie :
 * 1. Récupère tous les articles (paginés, max 100/page)
 * 2. Filtre ceux dont les véhicules correspondent à la marque + modèle L'Argus
 * 3. Groupe par productType → catégories
 */

import type { IVehicleCatalogProvider, CatalogVehicle, CatalogCategory, CatalogPart } from "../types";
import { CatalogProviderError } from "../errors";

// ─── Mapping productType (EN) → catégorie FR ─────────────────────────────────

const PRODUCT_TYPE_TO_CATEGORY: Record<string, string> = {
  // Freins
  "Brake Pad Set, disc brake": "Freins",
  "High Performance Brake Pad Set": "Freins",
  "Brake Disc": "Freins",
  "Brake Shoe Set": "Freins",
  "Brake Caliper": "Freins",
  "Brake Hose": "Freins",
  // Filtres
  "Oil Filter": "Filtres",
  "Air Filter": "Filtres",
  "Filter, cabin air": "Filtres",
  "Fuel Filter": "Filtres",
  // Moteur
  "Oil Dipstick": "Moteur",
  "Oil Cooler, engine oil": "Moteur",
  "Rail, oil pump drive chain": "Moteur",
  "Screw Plug, oil sump": "Moteur",
  "Timing Belt Kit": "Moteur",
  "Oil Pipe, charger": "Moteur",
  "Hydraulic Oil Additive": "Moteur",
  // Allumage
  "Spark Plug": "Allumage",
  "Ignition Cable Kit": "Allumage",
  "Ignition Switch": "Allumage",
  "Knock Sensor": "Allumage / Capteurs",
  "Sensor, crankshaft pulse": "Allumage / Capteurs",
  "Oxygen Sensor": "Allumage / Capteurs",
  // Suspension
  "Shock Absorber": "Suspension",
  "Spring": "Suspension",
  "Control/Trailing Arm, wheel suspension": "Suspension",
  "Mounting, control/trailing arm": "Suspension",
  "Ball Joint": "Suspension",
  "Tie Rod End": "Direction",
  // Transmission
  "Drive Shaft": "Transmission",
  "Joint Kit, drive shaft": "Transmission",
  "Clutch Kit": "Embrayage",
  "Clutch Release Bearing": "Embrayage",
  // Refroidissement
  "Radiator, engine cooling": "Refroidissement",
  "Expansion Tank, coolant": "Refroidissement",
  "Cap, coolant tank": "Refroidissement",
  "Coolant Flange": "Refroidissement",
  "Heat Exchanger, interior heating": "Refroidissement",
  // Suralimentation
  "Charger, charging (supercharged/turbocharged)": "Turbo / Suralimentation",
  "Charge Air Hose": "Turbo / Suralimentation",
  "Fastening Clamp, charge air hose": "Turbo / Suralimentation",
  // Échappement
  "Exhaust Pipe": "Échappement",
  "Exhaust Pipe, universal": "Échappement",
  "Exhaust System": "Échappement",
  "Rear Muffler": "Échappement",
  "Mounting Kit, exhaust system": "Échappement",
  // Stabilisation
  "Link/Coupling Rod, stabiliser bar": "Train roulant",
  "Mounting, stabiliser bar": "Train roulant",
  "Fastening Bolt, stabiliser bar": "Train roulant",
  // Démarrage
  "Starter": "Électrique",
  "Clock Spring, airbag": "Électrique",
  // Divers
  "Belt Tensioner, V-ribbed belt": "Courroies / Accessoires",
  "Deflection/Guide Pulley, V-ribbed belt": "Courroies / Accessoires",
  "Hydraulic Pump, steering": "Direction",
  "Gas Spring, boot/cargo area": "Carrosserie",
  "Mounting, engine": "Moteur",
  "Rivet, drum brake lining": "Freins",
  "Trailer Hitch": "Attelage",
};

function getCategory(productType: string | null): string {
  if (!productType) return "Divers";
  return PRODUCT_TYPE_TO_CATEGORY[productType] ?? "Divers";
}

// ─── Types API ────────────────────────────────────────────────────────────────

interface ApiVehicle {
  vehicleId: number;
  manufacturerName: string;
  modelName: string;
  engineVariant: string;
  productionStart: string | null;
  productionEnd: string | null;
}

interface ApiArticle {
  id: number;
  articleNumber: string;
  articleId: number | null;
  supplier: string | null;
  productType: string | null;
  ean: string | null;
  vehicles: ApiVehicle[];
  specifications?: { name: string; value: string }[];
  oemNumbers?: { brand: string; number: string }[];
}

interface ApiResponse {
  data: ApiArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Normalisation pour matching ─────────────────────────────────────────────

function normalizeForMatch(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Détermine si un véhicule API correspond aux données L'Argus.
 * Compare la marque et le début du modèle (ex: "XC60" dans "XC60 II (PD...)")
 */
function vehicleMatches(v: ApiVehicle, make: string, model: string): boolean {
  const apiMake = normalizeForMatch(v.manufacturerName);
  const apiModel = normalizeForMatch(v.modelName);
  const targetMake = normalizeForMatch(make);

  // Extrait le nom de base du modèle L'Argus (ex: "XC60 II" → "xc60")
  const modelBase = normalizeForMatch(model.split(" ")[0]);

  return apiMake === targetMake && apiModel.includes(modelBase);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class CustomApiProvider implements IVehicleCatalogProvider {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  private async fetch<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const res = await fetch(`${this.apiUrl}${path}`, {
        headers: {
          "X-API-Key": this.apiKey,
          Accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        throw new CatalogProviderError(`API pièces erreur ${res.status}`);
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

  async getPartsByVehicle(_kTypeId: number, make?: string, model?: string): Promise<CatalogCategory[]> {
    if (!make || !model) return [];

    // Récupère tous les articles via /search (inclut vehicles, specs, oemNumbers)
    // On utilise un terme générique pour tout récupérer
    const allArticles: ApiArticle[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const data = await this.fetch<ApiResponse>(
        `/api/articles/search?q=a&limit=100&page=${page}`,
      );
      allArticles.push(...data.data);
      totalPages = data.pagination.totalPages;
      page++;
    }

    // Filtre par véhicule compatible
    const compatible = allArticles.filter((article) =>
      Array.isArray(article.vehicles) &&
      article.vehicles.some((v) => vehicleMatches(v, make, model)),
    );

    if (compatible.length === 0) return [];

    // Groupe par catégorie
    const categoryMap = new Map<string, CatalogPart[]>();

    for (const article of compatible) {
      const categoryName = getCategory(article.productType);

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }

      const part: CatalogPart = {
        articleId: String(article.id),
        reference: article.articleNumber,
        name: article.productType ?? article.articleNumber,
        brand: article.supplier ?? "Inconnu",
        description: article.specifications
          ?.map((s) => `${s.name}: ${s.value}`)
          .slice(0, 3)
          .join(" — ") ?? null,
        oemNumbers: article.oemNumbers?.map((o) => `${o.brand}: ${o.number}`) ?? [],
      };

      categoryMap.get(categoryName)!.push(part);
    }

    // Trie les catégories par nombre de pièces (les plus fournies en premier)
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([name, parts]) => ({
        id: normalizeForMatch(name),
        name,
        parts,
      }));
  }
}

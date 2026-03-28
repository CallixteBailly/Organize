import type { CatalogVehicle } from "../types";
import { CatalogProviderError } from "../errors";

interface SivPayload {
  marque?: string;
  modele?: string;
  annee?: number | string;
  date_premiere_immatriculation?: string;
  energie?: string;
  cylindree?: number | string;
}

interface SivApiResponse extends SivPayload {
  data?: SivPayload;
}

function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[\s-]/g, "");
}

function parseYear(raw: string | number | undefined): number | null {
  if (!raw) return null;
  const str = String(raw);
  const match = str.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

// Génère un kTypeId déterministe depuis la plaque pour le provider SIV
// (le vrai kTypeId TecDoc nécessite TecDoc ; ici on crée un identifiant stable)
function plateToKTypeId(plate: string): number {
  const normalized = normalizePlate(plate);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return (hash % 900000) + 100000;
}

export class SivProvider {
  constructor(
    private apiKey: string | null,
    private apiUrl: string,
  ) {}

  async resolveVehicleByPlate(plate: string): Promise<CatalogVehicle | null> {
    const normalized = normalizePlate(plate);

    if (!this.apiKey) {
      console.warn("[SIV] IMMAT_API_KEY non configurée — mode dégradé");
      return this.fallbackVehicle(normalized);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(`${this.apiUrl}/immatriculation/${normalized}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (res.status === 404) return null;

      if (!res.ok) {
        throw new CatalogProviderError(
          `API SIV erreur ${res.status}: ${await res.text().catch(() => "?")}`,
        );
      }

      const data: SivApiResponse = await res.json();
      const payload: SivPayload = data.data ?? data;

      const make = payload.marque ?? "Inconnu";
      const model = payload.modele ?? "Inconnu";
      const year = parseYear(payload.date_premiere_immatriculation ?? payload.annee);

      return {
        kTypeId: plateToKTypeId(normalized),
        make,
        model,
        year,
        engineCode: null,
        fuelType: payload.energie ?? null,
        displacement:
          payload.cylindree != null ? parseInt(String(payload.cylindree), 10) || null : null,
      };
    } catch (err) {
      if (err instanceof CatalogProviderError) throw err;
      if ((err as Error).name === "AbortError") {
        throw new CatalogProviderError("Délai d'attente dépassé pour l'API SIV");
      }
      throw new CatalogProviderError(`Erreur API SIV: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  // Mode dégradé sans clé API : retourne un véhicule générique pour les plaques de démo
  private fallbackVehicle(plate: string): CatalogVehicle | null {
    const DEMO_PLATES: Record<string, Omit<CatalogVehicle, "kTypeId">> = {
      FG533LT: { make: "Renault", model: "Clio IV", year: 2018, engineCode: "H4B", fuelType: "Essence", displacement: 898 },
      AB123CD: { make: "Peugeot", model: "308 II", year: 2016, engineCode: "EP6", fuelType: "Essence", displacement: 1199 },
      GH456EF: { make: "Citroën", model: "C3 III", year: 2020, engineCode: "EB2", fuelType: "Essence", displacement: 1199 },
    };

    const demo = DEMO_PLATES[plate];
    if (demo) {
      return { kTypeId: plateToKTypeId(plate), ...demo };
    }

    // Plaque non reconnue sans clé API → null
    return null;
  }
}

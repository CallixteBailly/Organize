import type { IVehicleCatalogProvider, CatalogVehicle, CatalogCategory } from "../types";
import { CatalogProviderError } from "../errors";
import { MockCatalogProvider } from "./mock.provider";

const BASE_URL = "https://www.largus.fr/v4/remote/Cote.cfc";
const LARGUS_HOME = "https://www.largus.fr/cote-voiture/";

let _sessionCookie: string | null = null;

async function getSessionCookie(): Promise<string> {
  if (_sessionCookie) return _sessionCookie;
  try {
    const res = await fetch(LARGUS_HOME, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });
    const setCookie = res.headers.get("set-cookie") ?? "";
    // Extrait tous les cookies de session (CFID, CFTOKEN, JSESSIONID, etc.)
    const cookies = setCookie
      .split(",")
      .map((c) => c.split(";")[0].trim())
      .filter(Boolean)
      .join("; ");
    if (cookies) _sessionCookie = cookies;
  } catch {
    // Ignore — on continue sans cookie
  }
  return _sessionCookie ?? "";
}

interface LargusImmatriculation {
  jour: number;
  lib: string;
  mois: { lib: string; id: number };
  annee: number;
}

interface LargusData {
  codeProduit: number;
  libMarque: string;
  libFamille: string;
  libGeneration?: string;
  libFinition?: string;
  libVersion?: string;
  libEnergie?: string;
  libCarrosserie?: string;
  libBoite?: string;
  cylindre?: number;
  puissanceMoteurDIN?: number;
  puissanceMoteurKw?: number;
  cvFiscaux?: number;
  nbPortes?: number;
  est4x4?: number;
  immatriculation?: LargusImmatriculation;
  versionID?: number;
  codeGeneration?: number;
}

interface LargusResponse {
  success: boolean;
  code?: string;
  data?: LargusData;
}

/** Reformate une plaque normalisée (sans tirets) en format L'Argus (AA-000-AA) */
function formatPlateForLargus(normalized: string): string {
  // Format SIV post-2009 : 2 lettres + 3 chiffres + 2 lettres
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(normalized)) {
    return `${normalized.slice(0, 2)}-${normalized.slice(2, 5)}-${normalized.slice(5)}`;
  }
  // Autres formats (FNI, DOM-TOM…) : on passe tel quel
  return normalized;
}

export class LargusProvider implements IVehicleCatalogProvider {
  private readonly mockParts = new MockCatalogProvider();

  async resolveVehicleByPlate(plate: string, clientIp?: string): Promise<CatalogVehicle | null> {
    const formattedPlate = formatPlateForLargus(plate.toUpperCase().replace(/[\s-]/g, ""));

    const url = `${BASE_URL}?method=getImmatriculation&immatriculation=${encodeURIComponent(formattedPlate)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const sessionCookie = await getSessionCookie();

      const res = await fetch(url, {
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: "https://www.largus.fr/cote-voiture/",
          "X-Requested-With": "XMLHttpRequest",
          ...(sessionCookie ? { Cookie: sessionCookie } : {}),
          // Transmet l'IP du navigateur client pour que le quota s'applique
          // à l'IP du garage, pas à notre serveur
          ...(clientIp ? { "X-Forwarded-For": clientIp, "X-Real-IP": clientIp } : {}),
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        throw new CatalogProviderError(`L'Argus erreur HTTP ${res.status}`);
      }

      const json: LargusResponse = await res.json();

      if (process.env.NODE_ENV === "development") {
        console.debug("[Largus raw]", JSON.stringify(json, null, 2));
      }

      if (json.code === "ERROR-QUOTA") {
        // Invalide le cookie de session et réessaie une fois avec un nouveau
        _sessionCookie = null;
        throw new CatalogProviderError(
          "Quota L'Argus dépassé. Nouvelle session en cours — réessayez dans quelques secondes.",
        );
      }

      if (!json.success || !json.data || !json.data.codeProduit) return null;

      return this.parseVehicle(json.data, plate);
    } catch (err) {
      if (err instanceof CatalogProviderError) throw err;
      if ((err as Error).name === "AbortError") {
        throw new CatalogProviderError("Délai dépassé — L'Argus ne répond pas");
      }
      throw new CatalogProviderError(`Erreur L'Argus: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseVehicle(d: LargusData, rawPlate: string): CatalogVehicle {
    const model = [d.libFamille, d.libGeneration].filter(Boolean).join(" ");
    const year = d.immatriculation?.annee ?? null;

    return {
      kTypeId: d.codeProduit,
      make: d.libMarque,
      model,
      year,
      engineCode: d.libVersion?.split(" ").slice(0, 2).join(" ") ?? null,
      fuelType: d.libEnergie ?? null,
      displacement: d.cylindre ?? null,
    };
  }

  /** Les pièces viennent du catalogue mock (L'Argus ne fournit pas de catalogue pièces) */
  async getPartsByVehicle(kTypeId: number): Promise<CatalogCategory[]> {
    return this.mockParts.getPartsByVehicle(kTypeId);
  }
}

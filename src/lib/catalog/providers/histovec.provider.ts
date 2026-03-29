/**
 * HistovecProvider — Identification véhicule via le service officiel du gouvernement français
 * https://histovec.interieur.gouv.fr/
 *
 * Requiert : plaque + numéro de formule (carte grise) + nom du titulaire
 * Retourne  : marque, modèle, année, énergie, cylindrée depuis la base SIV
 *
 * Crypto : réponse chiffrée AES-256-CBC
 *   - Clé  = SHA-256(normaliser(plaque + formule))
 *   - IV   = 16 premiers octets du payload base64
 *   - Data = reste du payload
 */

import crypto from "node:crypto";
import type { IVehicleCatalogProvider, CatalogVehicle, CatalogCategory } from "../types";
import { CatalogProviderError } from "../errors";
import { MockCatalogProvider } from "./mock.provider";

// Endpoints découverts : /public/v1/ (authentifié) et /histovec/api/v1/ (405 sur POST)
// Accès officiel via agrément ANTS : histovec@interieur.gouv.fr
const HISTOVEC_API = "https://histovec.interieur.gouv.fr/public/v1";

// ─── Normalisation ─────────────────────────────────────────────────────────────

function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Normalise selon la préparation de données Histovec (majuscules, sans accents, sans séparateurs) */
function normalizeForKey(str: string): string {
  return removeDiacritics(str)
    .toUpperCase()
    .replace(/[\s\-_.,;:'"]/g, "");
}

// ─── Crypto ───────────────────────────────────────────────────────────────────

function deriveKey(plate: string, formule: string): Buffer {
  const input = normalizeForKey(plate) + normalizeForKey(formule);
  return crypto.createHash("sha256").update(input, "utf8").digest();
}

function decryptResponse(encryptedBase64: string, key: Buffer): unknown {
  const data = Buffer.from(encryptedBase64, "base64");
  // Les 16 premiers octets sont l'IV (vecteur d'initialisation)
  const iv = data.subarray(0, 16);
  const encrypted = data.subarray(16);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}

// ─── Parsing de la réponse SIV ────────────────────────────────────────────────

interface SivVehicule {
  marque?: string;
  modele?: string;
  modele_etude?: string;
  genre?: string;
  carrosserie?: string;
  energie?: string;
  cylindree?: number | string;
  puissance_fiscale?: number | string;
  puissance_nette?: number | string;
  date_premiere_immatriculation?: string;
  annee_premiere_immatriculation?: number | string;
  couleur?: string;
  numero_identification?: string; // VIN
  type_mine?: string;
  [key: string]: unknown;
}

interface HistovecDecryptedReport {
  vehicule?: SivVehicule;
  v?: SivVehicule; // Certaines versions abrègent les clés
  [key: string]: unknown;
}

function parseYear(raw: string | number | undefined): number | null {
  if (!raw) return null;
  const str = String(raw);
  const match = str.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

function parseSivVehicle(siv: SivVehicule, plate: string): CatalogVehicle {
  // kTypeId déterministe depuis la plaque (hash stable)
  const normalized = plate.toUpperCase().replace(/[\s-]/g, "");
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  const kTypeId = (hash % 900000) + 100000;

  const year = parseYear(siv.date_premiere_immatriculation ?? siv.annee_premiere_immatriculation);
  const displacement = siv.cylindree ? parseInt(String(siv.cylindree), 10) || null : null;

  return {
    kTypeId,
    make: siv.marque ?? "Inconnu",
    model: siv.modele ?? siv.modele_etude ?? "Inconnu",
    year,
    engineCode: siv.type_mine ?? null,
    fuelType: siv.energie ?? null,
    displacement,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface HistovecParams {
  formule: string;       // Numéro de formule (ex: 20140AB12345)
  nom: string;           // Nom du titulaire (ex: DUPONT)
  prenoms?: string[];    // Prénoms (optionnel, ex: ["JEAN"])
  siren?: string;        // Si personne morale
}

export class HistovecProvider implements IVehicleCatalogProvider {
  private readonly mockParts = new MockCatalogProvider();

  async resolveVehicleByPlate(
    plate: string,
    params?: HistovecParams,
  ): Promise<CatalogVehicle | null> {
    if (!params?.formule || !params?.nom) {
      throw new CatalogProviderError(
        "Histovec requiert le numéro de formule et le nom du titulaire (inscrits sur la carte grise).",
      );
    }

    const { formule, nom, prenoms = [""], siren } = params;
    const normalizedPlate = plate.toUpperCase().replace(/[\s-]/g, "");

    // Titulaire : particulier ou personne morale
    const titulaire = siren
      ? { personne_morale: { raison_sociale: nom.toUpperCase(), siren } }
      : { particulier: { nom: removeDiacritics(nom).toUpperCase(), prenoms: prenoms.map((p) => removeDiacritics(p).toUpperCase()) } };

    const body = {
      uuid: crypto.randomUUID(),
      vehicule: {
        certificat_immatriculation: {
          titulaire,
          numero_immatriculation: normalizedPlate,
          numero_formule: formule.toUpperCase().replace(/\s/g, ""),
        },
      },
      options: {
        controles_techniques: false,
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const res = await fetch(`${HISTOVEC_API}/report_by_data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; Organize-Garage/1.0)",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      });

      // Détecte une réponse HTML (redirect vers page de login ou erreur nginx)
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        throw new CatalogProviderError(
          res.status === 401 || res.status === 403
            ? "Histovec requiert un accès officiel ANTS. Contactez histovec@interieur.gouv.fr pour obtenir les credentials."
            : `Histovec n'est pas accessible depuis ce serveur (${res.status}). Accès officiel requis via l'ANTS.`,
        );
      }

      if (res.status === 401 || res.status === 403) {
        throw new CatalogProviderError(
          "Histovec requiert un accès officiel ANTS. Contactez histovec@interieur.gouv.fr.",
        );
      }

      if (res.status === 404) {
        // 404 sur l'endpoint = URL incorrecte (pas de véhicule introuvable)
        // L'accès officiel ANTS est requis pour accéder à l'API Histovec
        throw new CatalogProviderError(
          "L'API Histovec n'est pas accessible sans agrément officiel ANTS. " +
          "Contactez histovec@interieur.gouv.fr pour obtenir un accès professionnel.",
        );
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new CatalogProviderError(`Histovec erreur ${res.status}: ${text.slice(0, 200)}`);
      }

      const raw = await res.text();

      // Vérifie que la réponse est bien du JSON
      if (raw.trimStart().startsWith("<")) {
        throw new CatalogProviderError(
          "Histovec a retourné une page HTML — accès officiel ANTS requis.",
        );
      }

      const json = JSON.parse(raw) as unknown;

      if (process.env.NODE_ENV === "development") {
        console.debug("[Histovec raw response]", JSON.stringify(json, null, 2).slice(0, 3000));
      }

      return this.parseResponse(json, normalizedPlate, plate, formule);
    } catch (err) {
      if (err instanceof CatalogProviderError) throw err;
      if ((err as Error).name === "AbortError") {
        throw new CatalogProviderError("Délai dépassé — Histovec ne répond pas");
      }
      throw new CatalogProviderError(`Histovec inaccessible: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseResponse(
    json: unknown,
    normalizedPlate: string,
    rawPlate: string,
    formule: string,
  ): CatalogVehicle | null {
    if (!json || typeof json !== "object") return null;
    const data = json as Record<string, unknown>;

    // Cas 1 : réponse chiffrée (champ "data" ou "encrypted" en base64)
    const encrypted = data.data ?? data.encrypted ?? data.rapport ?? null;
    if (typeof encrypted === "string" && encrypted.length > 50) {
      try {
        const key = deriveKey(normalizedPlate, formule);
        const decrypted = decryptResponse(encrypted, key) as HistovecDecryptedReport;

        if (process.env.NODE_ENV === "development") {
          console.debug("[Histovec decrypted]", JSON.stringify(decrypted, null, 2).slice(0, 3000));
        }

        const siv = decrypted?.vehicule ?? decrypted?.v;
        if (siv) return parseSivVehicle(siv, rawPlate);
      } catch (cryptoErr) {
        console.error("[Histovec] Échec déchiffrement:", (cryptoErr as Error).message);
      }
    }

    // Cas 2 : réponse JSON directe (certaines versions de l'API)
    const siv = (data.vehicule ?? data.v ?? data) as SivVehicule;
    if (siv?.marque) return parseSivVehicle(siv, rawPlate);

    return null;
  }

  /** Les pièces viennent du catalogue mock (Histovec ne fournit pas de catalogue pièces) */
  async getPartsByVehicle(kTypeId: number): Promise<CatalogCategory[]> {
    return this.mockParts.getPartsByVehicle(kTypeId);
  }
}

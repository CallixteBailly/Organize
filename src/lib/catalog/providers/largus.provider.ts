import type { IVehicleCatalogProvider, CatalogVehicle, CatalogCategory } from "../types";
import { CatalogProviderError } from "../errors";
import { MockCatalogProvider } from "./mock.provider";

const BASE_URL = "https://www.largus.fr/v4/remote/Cote.cfc";
const LARGUS_HOME = "https://www.largus.fr/cote-voiture/";

// ── Configuration résilience ─────────────────────────────────────────────────
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1_000;
const REQUEST_TIMEOUT_MS = 10_000;
const SESSION_TIMEOUT_MS = 5_000;
const SESSION_MAX_AGE_MS = 25 * 60_000;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 60_000;

interface SessionState {
  cookie: string;
  fetchedAt: number;
  refreshPromise: Promise<string> | null;
}

interface CircuitBreakerState {
  consecutiveFailures: number;
  lastFailureAt: number;
  isOpen: boolean;
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
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(normalized)) {
    return `${normalized.slice(0, 2)}-${normalized.slice(2, 5)}-${normalized.slice(5)}`;
  }
  return normalized;
}

export class LargusProvider implements IVehicleCatalogProvider {
  private readonly mockParts = new MockCatalogProvider();

  private session: SessionState = {
    cookie: "",
    fetchedAt: 0,
    refreshPromise: null,
  };

  private circuit: CircuitBreakerState = {
    consecutiveFailures: 0,
    lastFailureAt: 0,
    isOpen: false,
  };

  // ── Session management ────────────────────────────────────────────────────

  private isSessionExpired(): boolean {
    if (!this.session.cookie) return true;
    return Date.now() - this.session.fetchedAt > SESSION_MAX_AGE_MS;
  }

  private invalidateSession(): void {
    this.session.cookie = "";
    this.session.fetchedAt = 0;
  }

  private async getSessionCookie(forceRefresh = false): Promise<string> {
    if (!forceRefresh && !this.isSessionExpired()) {
      return this.session.cookie;
    }

    if (this.session.refreshPromise) {
      return this.session.refreshPromise;
    }

    this.session.refreshPromise = this.fetchSessionCookie();

    try {
      return await this.session.refreshPromise;
    } finally {
      this.session.refreshPromise = null;
    }
  }

  private async fetchSessionCookie(): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS);

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
        signal: controller.signal,
      });

      const setCookie = res.headers.get("set-cookie") ?? "";
      const cookies = setCookie
        .split(",")
        .map((c) => c.split(";")[0].trim())
        .filter(Boolean)
        .join("; ");

      if (cookies) {
        this.session.cookie = cookies;
        this.session.fetchedAt = Date.now();
      }
    } catch (err) {
      console.warn("[Largus] Échec récupération session:", (err as Error).message);
    } finally {
      clearTimeout(timeout);
    }

    return this.session.cookie;
  }

  // ── Circuit breaker ───────────────────────────────────────────────────────

  private isCircuitOpen(): boolean {
    if (!this.circuit.isOpen) return false;

    if (Date.now() - this.circuit.lastFailureAt >= CIRCUIT_BREAKER_COOLDOWN_MS) {
      this.circuit.isOpen = false;
      return false;
    }

    return true;
  }

  private recordSuccess(): void {
    this.circuit.consecutiveFailures = 0;
    this.circuit.isOpen = false;
  }

  private recordFailure(): void {
    this.circuit.consecutiveFailures++;
    this.circuit.lastFailureAt = Date.now();
    if (this.circuit.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      this.circuit.isOpen = true;
      console.warn(
        `[Largus] Circuit ouvert après ${this.circuit.consecutiveFailures} échecs consécutifs. ` +
          `Cooldown ${CIRCUIT_BREAKER_COOLDOWN_MS / 1000}s.`,
      );
    }
  }

  // ── Retry helpers ─────────────────────────────────────────────────────────

  private getRetryDelay(attempt: number): number {
    return BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * BASE_DELAY_MS;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isTransientError(err: unknown): boolean {
    if (err instanceof CatalogProviderError) {
      const msg = err.message;
      if (msg.includes("Quota")) return true;
      if (msg.includes("Délai dépassé") || msg.includes("ne répond pas")) return true;
      if (/erreur HTTP 5\d{2}/.test(msg)) return true;
    }
    return false;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async resolveVehicleByPlate(plate: string, clientIp?: string): Promise<CatalogVehicle | null> {
    if (this.isCircuitOpen()) {
      console.warn("[Largus] Circuit ouvert — requête ignorée");
      return null;
    }

    const formattedPlate = formatPlateForLargus(plate.toUpperCase().replace(/[\s-]/g, ""));
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = this.getRetryDelay(attempt - 1);
        console.warn(`[Largus] Retry ${attempt}/${MAX_RETRIES} après ${Math.round(delay)}ms`);
        await this.sleep(delay);
      }

      try {
        const result = await this.attemptFetch(formattedPlate, plate, clientIp);
        this.recordSuccess();
        return result;
      } catch (err) {
        lastError = err as Error;

        if (err instanceof CatalogProviderError && err.message.includes("Quota")) {
          this.invalidateSession();
        }

        if (!this.isTransientError(err)) {
          this.recordFailure();
          throw err;
        }

        if (attempt === MAX_RETRIES) {
          this.recordFailure();
        }
      }
    }

    throw lastError ?? new CatalogProviderError("L'Argus indisponible après plusieurs tentatives");
  }

  /** Les pièces viennent du catalogue mock (L'Argus ne fournit pas de catalogue pièces) */
  async getPartsByVehicle(kTypeId: number): Promise<CatalogCategory[]> {
    return this.mockParts.getPartsByVehicle(kTypeId);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async attemptFetch(
    formattedPlate: string,
    rawPlate: string,
    clientIp?: string,
  ): Promise<CatalogVehicle | null> {
    const url = `${BASE_URL}?method=getImmatriculation&immatriculation=${encodeURIComponent(formattedPlate)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const sessionCookie = await this.getSessionCookie();

      const res = await fetch(url, {
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: "https://www.largus.fr/cote-voiture/",
          "X-Requested-With": "XMLHttpRequest",
          ...(sessionCookie ? { Cookie: sessionCookie } : {}),
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
        throw new CatalogProviderError(
          "Quota L'Argus dépassé — rafraîchissement session en cours",
        );
      }

      if (!json.success || !json.data || !json.data.codeProduit) return null;

      return this.parseVehicle(json.data, rawPlate);
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
}

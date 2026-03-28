/**
 * CloudflareSessionManager — stratégie cloudscraper en Node.js
 *
 * Même approche que https://github.com/VeNoMouS/cloudscraper :
 * 1. Tentative de requête directe
 * 2. Si Cloudflare bloque (403 / challenge), lancement de Chromium headless
 * 3. Navigation réelle → Cloudflare se résout tout seul (vrai navigateur)
 * 4. Extraction des cookies (cf_clearance, XSRF-TOKEN, session…)
 * 5. Extraction du CSRF token depuis le DOM
 * 6. Cache en mémoire (TTL 4h, durée de vie de cf_clearance)
 * 7. Retry automatique sur 403
 */

export interface AutoDocSession {
  cookies: string;
  csrfToken: string;
  expiresAt: number;
}

const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 heures (durée cf_clearance)
const AUTO_DOC_URL = "https://www.auto-doc.fr";

let _session: AutoDocSession | null = null;
let _refreshing: Promise<AutoDocSession> | null = null;

function isValid(session: AutoDocSession | null): boolean {
  return !!(session && Date.now() < session.expiresAt);
}

export async function getAutoDocSession(): Promise<AutoDocSession> {
  if (isValid(_session)) return _session!;

  // Évite les refreshs parallèles — un seul lancement de browser à la fois
  if (_refreshing) return _refreshing;

  _refreshing = refreshSession().finally(() => {
    _refreshing = null;
  });

  return _refreshing;
}

export function invalidateSession(): void {
  _session = null;
}

async function refreshSession(): Promise<AutoDocSession> {
  console.log("[CloudflareSession] Démarrage Chromium headless pour résoudre le challenge…");

  // Import dynamique — exclu du bundle client (voir next.config serverExternalPackages)
  const { chromium } = await import("playwright-core");

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled", // Cache l'attribut webdriver
    ],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      locale: "fr-FR",
      viewport: { width: 1280, height: 800 },
      extraHTTPHeaders: {
        "accept-language": "fr,fr-FR;q=0.9,en;q=0.8",
      },
    });

    const page = await context.newPage();

    // Masque navigator.webdriver (comme playwright-extra-plugin-stealth)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, "languages", { get: () => ["fr-FR", "fr", "en"] });
    });

    // Navigue vers auto-doc.fr et attend que Cloudflare se résolve
    await page.goto(AUTO_DOC_URL, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });

    // Attend que la page soit bien chargée (pas une page de challenge CF)
    await page.waitForFunction(
      () => !document.title.includes("Just a moment") && !document.title.includes("Attention"),
      { timeout: 20_000 },
    ).catch(() => {
      console.warn("[CloudflareSession] Cloudflare challenge peut ne pas être résolu");
    });

    // Extrait le CSRF token depuis le DOM (meta tag Laravel standard)
    const csrfToken = await page.evaluate((): string => {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
      if (meta?.content) return meta.content;
      // Fallback : cherche dans les scripts inline
      const scripts = Array.from(document.querySelectorAll("script"));
      for (const s of scripts) {
        const match = s.textContent?.match(/"csrfToken"\s*:\s*"([^"]+)"/);
        if (match) return match[1];
        const match2 = s.textContent?.match(/window\.__CSRF__\s*=\s*["']([^"']+)["']/);
        if (match2) return match2[1];
      }
      return "";
    });

    // Si pas de CSRF dans le DOM, on fait une requête AJAX pour le capturer
    let resolvedCsrf = csrfToken;
    if (!resolvedCsrf) {
      resolvedCsrf = await captureXsrfFromRequest(page);
    }

    // Extrait tous les cookies du contexte
    const playwrightCookies = await context.cookies();
    const cookieString = playwrightCookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    if (!cookieString.includes("cf_clearance")) {
      console.warn("[CloudflareSession] cf_clearance absent — Cloudflare n'est peut-être pas résolu");
    }

    const session: AutoDocSession = {
      cookies: cookieString,
      csrfToken: resolvedCsrf,
      expiresAt: Date.now() + SESSION_TTL_MS,
    };

    _session = session;
    console.log("[CloudflareSession] Session auto-doc obtenue. CSRF:", resolvedCsrf ? "✓" : "absent");

    return session;
  } finally {
    await browser.close();
  }
}

/**
 * Fait une fausse requête AJAX pour capturer le x-csrf-token
 * envoyé par le navigateur (certains sites injectent le token dans JS).
 */
async function captureXsrfFromRequest(page: import("playwright-core").Page): Promise<string> {
  let captured = "";

  await page.route("**/ajax/**", (route) => {
    const headers = route.request().headers();
    const token = headers["x-csrf-token"] ?? "";
    if (token) captured = token;
    route.continue();
  });

  // Déclenche une requête AJAX légère (liste des constructeurs)
  await page.evaluate(async () => {
    try {
      await fetch("/ajax/selector/vehicle/", {
        headers: { "x-requested-with": "XMLHttpRequest" },
      });
    } catch { /* ignoré */ }
  }).catch(() => {});

  await page.waitForTimeout(1500);
  await page.unroute("**/ajax/**");

  return captured;
}

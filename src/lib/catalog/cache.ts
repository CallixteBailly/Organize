import type { CatalogVehicle, CatalogCategory } from "./types";

let _redis: {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, opts?: { ex?: number }) => Promise<void>;
} | null = null;
let _initialized = false;

function getRedis() {
  if (_initialized) return _redis;
  _initialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[Catalog Cache] UPSTASH_REDIS_REST_URL/TOKEN non configurés — cache désactivé");
    _redis = null;
    return null;
  }

  try {
    const { Redis } = require("@upstash/redis");
    _redis = new Redis({ url, token });
  } catch {
    console.warn("[Catalog Cache] Erreur d'initialisation Redis — cache désactivé");
    _redis = null;
  }

  return _redis;
}

export async function getCachedVehicle(plate: string): Promise<CatalogVehicle | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(`catalog:vehicle:${plate}`);
    if (!raw) return null;
    return JSON.parse(raw) as CatalogVehicle;
  } catch {
    return null;
  }
}

export async function setCachedVehicle(
  plate: string,
  vehicle: CatalogVehicle,
  ttl: number,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(`catalog:vehicle:${plate}`, JSON.stringify(vehicle), { ex: ttl });
  } catch {
    // Cache non critique — on ignore l'erreur
  }
}

export async function getCachedParts(kTypeId: number): Promise<CatalogCategory[] | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(`catalog:parts:${kTypeId}`);
    if (!raw) return null;
    return JSON.parse(raw) as CatalogCategory[];
  } catch {
    return null;
  }
}

export async function setCachedParts(
  kTypeId: number,
  categories: CatalogCategory[],
  ttl: number,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(`catalog:parts:${kTypeId}`, JSON.stringify(categories), { ex: ttl });
  } catch {
    // Cache non critique — on ignore l'erreur
  }
}

export async function deleteCachedParts(kTypeId: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await (redis as unknown as { del: (key: string) => Promise<void> }).del(`catalog:parts:${kTypeId}`);
  } catch {
    // Ignore
  }
}

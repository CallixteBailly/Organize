import { AI_RATE_LIMIT } from "@/lib/constants/ai";
import { AIRateLimitError } from "./errors";

let _limiter: { limit: (id: string) => Promise<{ success: boolean }> } | null = null;
let _initialized = false;

function getLimiter() {
  if (_initialized) return _limiter;
  _initialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[AI Rate Limit] UPSTASH_REDIS_REST_URL/TOKEN non configurés — rate limiting désactivé");
    _limiter = null;
    return null;
  }

  try {
    // Dynamic import pour éviter l'erreur si les packages ne sont pas configurés
    const { Redis } = require("@upstash/redis");
    const { Ratelimit } = require("@upstash/ratelimit");

    const redis = new Redis({ url, token });
    _limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(AI_RATE_LIMIT.maxRequests, `${AI_RATE_LIMIT.windowSeconds} s`),
      prefix: "ai-ratelimit",
    });
  } catch {
    console.warn("[AI Rate Limit] Erreur d'initialisation — rate limiting désactivé");
    _limiter = null;
  }

  return _limiter;
}

export async function checkAIRateLimit(identifier: string): Promise<void> {
  const limiter = getLimiter();
  if (!limiter) return; // Pas de rate limiting si Redis non configuré

  const { success } = await limiter.limit(identifier);
  if (!success) {
    throw new AIRateLimitError();
  }
}

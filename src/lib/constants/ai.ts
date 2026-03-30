export const AI_DEFAULTS = {
  baseUrl: "https://api.z.ai/api/coding/paas/v4/",
  model: "glm-4.7",
  maxTokens: 2000,
  timeout: 120_000,
  temperature: 0,
} as const;

export const AI_RATE_LIMIT = {
  maxRequests: 20,
  windowSeconds: 60,
} as const;

export const AI_CONFIDENCE_THRESHOLDS = {
  high: 0.7,
  low: 0.4,
} as const;

export const AI_INPUT_LIMITS = {
  minLength: 3,
  maxLength: 500,
} as const;

export const AI_CHAT = {
  maxIterations: 5,
  maxHistory: 20,
  maxMessageLength: 2000,
} as const;

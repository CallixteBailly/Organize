import { AI_DEFAULTS } from "@/lib/constants/ai";

export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  timeout: number;
  enabled: boolean;
}

let _config: AIConfig | undefined;

export function getAIConfig(): AIConfig {
  if (_config) return _config;

  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) {
    throw new Error("ZAI_API_KEY n'est pas configurée");
  }

  _config = {
    apiKey,
    baseUrl: process.env.ZAI_BASE_URL ?? AI_DEFAULTS.baseUrl,
    model: process.env.ZAI_MODEL ?? AI_DEFAULTS.model,
    maxTokens: Number(process.env.ZAI_MAX_TOKENS) || AI_DEFAULTS.maxTokens,
    timeout: Number(process.env.ZAI_TIMEOUT) || AI_DEFAULTS.timeout,
    enabled: process.env.AI_ENABLED !== "false",
  };

  return _config;
}

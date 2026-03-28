import { describe, it, expect, vi, beforeEach } from "vitest";

describe("getAIConfig", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("lève une erreur si ZAI_API_KEY est absente", async () => {
    vi.stubEnv("ZAI_API_KEY", "");
    const { getAIConfig } = await import("../config");
    expect(() => getAIConfig()).toThrow("ZAI_API_KEY");
  });

  it("retourne la config avec les défauts", async () => {
    vi.stubEnv("ZAI_API_KEY", "test-key-123");
    const { getAIConfig } = await import("../config");
    const config = getAIConfig();
    expect(config.apiKey).toBe("test-key-123");
    expect(config.baseUrl).toBe("https://api.z.ai/api/coding/paas/v4/");
    expect(config.model).toBe("glm-4.7");
    expect(config.maxTokens).toBe(2000);
    expect(config.timeout).toBe(120000);
    expect(config.enabled).toBe(true);
  });

  it("respecte les overrides env", async () => {
    vi.stubEnv("ZAI_API_KEY", "my-key");
    vi.stubEnv("ZAI_MODEL", "glm-5");
    vi.stubEnv("ZAI_MAX_TOKENS", "4000");
    vi.stubEnv("AI_ENABLED", "false");
    const { getAIConfig } = await import("../config");
    const config = getAIConfig();
    expect(config.model).toBe("glm-5");
    expect(config.maxTokens).toBe(4000);
    expect(config.enabled).toBe(false);
  });
});

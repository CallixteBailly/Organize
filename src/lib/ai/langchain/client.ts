import { ChatOpenAI } from "@langchain/openai";
import { getAIConfig } from "@/lib/ai/config";

let _client: ChatOpenAI | undefined;

export function getAIClient(): ChatOpenAI {
  if (_client) return _client;

  const config = getAIConfig();

  _client = new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: 0,
    timeout: config.timeout,
    configuration: {
      baseURL: config.baseUrl,
    },
  });

  return _client;
}

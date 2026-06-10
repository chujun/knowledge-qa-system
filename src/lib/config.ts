export const appConfig = {
  defaultAgent: process.env.DEFAULT_AI_AGENT ?? "Codex",
  defaultModelProvider: process.env.DEFAULT_MODEL_PROVIDER ?? "mock",
  defaultModel: process.env.DEFAULT_MODEL_NAME ?? "minimax-m2.7-highspeed",
  apiKeyConfigured: Boolean(process.env.KNOWLEDGE_QA_API_KEY),
  minimaxApiKeyConfigured: Boolean(process.env.MINIMAX_API_KEY),
  minimaxApiBaseUrl: process.env.MINIMAX_API_BASE_URL ?? "https://api.minimaxi.com/v1"
};

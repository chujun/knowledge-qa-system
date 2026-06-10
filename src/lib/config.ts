export const appConfig = {
  defaultAgent: process.env.DEFAULT_AI_AGENT ?? "Codex",
  defaultModel: process.env.DEFAULT_MODEL_NAME ?? "minimax-m2.7-highspeed",
  apiKeyConfigured: Boolean(process.env.KNOWLEDGE_QA_API_KEY)
};

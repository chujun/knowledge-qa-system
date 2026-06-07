export const appConfig = {
  defaultAgent: process.env.DEFAULT_AI_AGENT ?? "Codex",
  defaultModel: process.env.DEFAULT_MODEL_NAME ?? "chatgpt-5.5",
  apiKeyConfigured: Boolean(process.env.KNOWLEDGE_QA_API_KEY)
};

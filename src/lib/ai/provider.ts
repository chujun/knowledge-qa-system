export type AiMessageRole = "system" | "user" | "assistant";

export interface AiMessage {
  role: AiMessageRole;
  content: string;
}

export interface AiProviderRequest {
  model: string;
  messages: AiMessage[];
  responseFormat?: "text" | "json";
  temperature?: number;
  timeoutMs?: number;
}

export interface AiProviderUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}

export interface AiProviderResult {
  provider: string;
  modelName: string;
  modelVersion: string | null;
  content: string;
  usage: AiProviderUsage;
  latencyMs: number;
  rawResponseSummary: string;
}

export class AiProviderError extends Error {
  readonly code: string;
  readonly status: number | null;
  readonly provider: string;
  readonly latencyMs: number;

  constructor({
    code,
    message,
    provider,
    status,
    latencyMs
  }: {
    code: string;
    message: string;
    provider: string;
    status?: number | null;
    latencyMs: number;
  }) {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
    this.provider = provider;
    this.status = status ?? null;
    this.latencyMs = latencyMs;
  }
}

export interface AiProvider {
  name: string;
  generate(request: AiProviderRequest): Promise<AiProviderResult>;
}

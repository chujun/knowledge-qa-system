import { z } from "zod";

import { appConfig } from "@/lib/config";
import {
  AiProviderError,
  type AiProvider,
  type AiProviderRequest,
  type AiProviderResult
} from "@/lib/ai/provider";

const providerName = "minimax";
const defaultTimeoutMs = 30_000;

const minimaxResponseSchema = z.object({
  id: z.string().optional(),
  model: z.string().optional(),
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string()
        })
      })
    )
    .min(1),
  usage: z
    .object({
      prompt_tokens: z.number().int().nonnegative().optional(),
      completion_tokens: z.number().int().nonnegative().optional(),
      total_tokens: z.number().int().nonnegative().optional()
    })
    .optional()
});

export interface MinimaxProviderOptions {
  apiKey?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export function createMinimaxProvider(options: MinimaxProviderOptions = {}): AiProvider {
  const apiKey = options.apiKey ?? process.env.MINIMAX_API_KEY;
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? appConfig.minimaxApiBaseUrl);
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    name: providerName,
    async generate(request: AiProviderRequest) {
      return callMinimaxChatCompletion({
        request,
        apiKey,
        baseUrl,
        fetchImpl
      });
    }
  };
}

export async function callMinimaxChatCompletion({
  request,
  apiKey,
  baseUrl,
  fetchImpl
}: {
  request: AiProviderRequest;
  apiKey?: string;
  baseUrl: string;
  fetchImpl: typeof fetch;
}): Promise<AiProviderResult> {
  const startedAt = Date.now();

  if (!apiKey) {
    throw new AiProviderError({
      code: "MODEL_API_KEY_MISSING",
      message: "MINIMAX_API_KEY 未配置",
      provider: providerName,
      latencyMs: 0
    });
  }

  const timeoutMs = request.timeoutMs ?? defaultTimeoutMs;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildMinimaxRequestBody(request)),
      signal: controller.signal
    });
    const latencyMs = Date.now() - startedAt;
    const payload = await readJsonResponse(response);

    if (!response.ok) {
      throw new AiProviderError({
        code: "MODEL_PROVIDER_ERROR",
        message: summarizeErrorPayload(payload),
        provider: providerName,
        status: response.status,
        latencyMs
      });
    }

    const parsed = minimaxResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AiProviderError({
        code: "MODEL_RESPONSE_INVALID",
        message: "Minimax 响应结构不符合 Chat Completions 预期",
        provider: providerName,
        status: response.status,
        latencyMs
      });
    }

    const usage = parsed.data.usage;
    return {
      provider: providerName,
      modelName: parsed.data.model ?? request.model,
      modelVersion: parsed.data.model ?? null,
      content: parsed.data.choices[0].message.content,
      usage: {
        inputTokens: usage?.prompt_tokens ?? null,
        outputTokens: usage?.completion_tokens ?? null,
        totalTokens: usage?.total_tokens ?? null
      },
      latencyMs,
      rawResponseSummary: JSON.stringify({
        id: parsed.data.id ?? null,
        model: parsed.data.model ?? request.model,
        choices: parsed.data.choices.length,
        usage: usage ?? null
      })
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    if (error instanceof AiProviderError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiProviderError({
        code: "MODEL_PROVIDER_TIMEOUT",
        message: `Minimax 调用超过 ${timeoutMs}ms`,
        provider: providerName,
        latencyMs
      });
    }
    throw new AiProviderError({
      code: "MODEL_PROVIDER_NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Minimax 网络调用失败",
      provider: providerName,
      latencyMs
    });
  } finally {
    clearTimeout(timer);
  }
}

export function buildMinimaxRequestBody(request: AiProviderRequest) {
  return {
    model: request.model,
    messages: request.messages,
    temperature: request.temperature ?? 0.2,
    ...(request.responseFormat === "json"
      ? {
          response_format: {
            type: "json_object"
          }
        }
      : {})
  };
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text.slice(0, 500) };
  }
}

function summarizeErrorPayload(payload: unknown) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const message = record.message ?? record.error ?? record.err_msg;
    if (typeof message === "string") {
      return message.slice(0, 500);
    }
  }
  return "Minimax 模型服务返回失败";
}

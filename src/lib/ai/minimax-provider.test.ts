import { describe, expect, it, vi } from "vitest";

import {
  buildMinimaxRequestBody,
  callMinimaxChatCompletion
} from "./minimax-provider";
import { AiProviderError } from "./provider";

describe("minimax provider", () => {
  it("builds an OpenAI compatible JSON request body", () => {
    expect(
      buildMinimaxRequestBody({
        model: "minimax-m2.7-highspeed",
        responseFormat: "json",
        maxTokens: 2000,
        messages: [
          { role: "system", content: "只返回 JSON" },
          { role: "user", content: "生成一道题" }
        ]
      })
    ).toEqual({
      model: "minimax-m2.7-highspeed",
      messages: [
        { role: "system", content: "只返回 JSON" },
        { role: "user", content: "生成一道题" }
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: {
        type: "json_object"
      }
    });
  });

  it("parses a successful chat completion response", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: "chatcmpl-test",
          model: "minimax-m2.7-highspeed",
          choices: [
            {
              message: {
                content: "{\"stem\":\"GitHub Actions 是什么？\"}"
              }
            }
          ],
          usage: {
            prompt_tokens: 12,
            completion_tokens: 8,
            total_tokens: 20
          }
        }),
        { status: 200 }
      )
    );

    const result = await callMinimaxChatCompletion({
      request: {
        model: "minimax-m2.7-highspeed",
        messages: [{ role: "user", content: "生成一道题" }],
        responseFormat: "json"
      },
      apiKey: "test-key",
      baseUrl: "https://api.minimaxi.com/v1/",
      fetchImpl
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.minimaxi.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key"
        })
      })
    );
    expect(result.provider).toBe("minimax");
    expect(result.modelName).toBe("minimax-m2.7-highspeed");
    expect(result.content).toContain("GitHub Actions");
    expect(result.usage).toEqual({
      inputTokens: 12,
      outputTokens: 8,
      totalTokens: 20
    });
  });

  it("fails fast when the API key is missing", async () => {
    await expect(
      callMinimaxChatCompletion({
        request: {
          model: "minimax-m2.7-highspeed",
          messages: [{ role: "user", content: "hello" }]
        },
        apiKey: undefined,
        baseUrl: "https://api.minimaxi.com/v1",
        fetchImpl: vi.fn()
      })
    ).rejects.toMatchObject({
      code: "MODEL_API_KEY_MISSING",
      provider: "minimax"
    } satisfies Partial<AiProviderError>);
  });

  it("wraps provider HTTP errors without exposing secrets", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ message: "quota exceeded" }), { status: 429 })
    );

    await expect(
      callMinimaxChatCompletion({
        request: {
          model: "minimax-m2.7-highspeed",
          messages: [{ role: "user", content: "hello" }]
        },
        apiKey: "secret-key",
        baseUrl: "https://api.minimaxi.com/v1",
        fetchImpl
      })
    ).rejects.toMatchObject({
      code: "MODEL_PROVIDER_ERROR",
      status: 429,
      message: "quota exceeded"
    } satisfies Partial<AiProviderError>);
  });
});

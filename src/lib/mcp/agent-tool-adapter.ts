import { z } from "zod";

import {
  confirmIngestionInputSchema,
  createFromConversationInputSchema,
  createPracticeSessionInputSchema,
  getReviewQueueInputSchema,
  type KnowledgeQaMcpToolName
} from "./tools";

export interface KnowledgeQaToolConfig {
  apiBaseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
}

export interface KnowledgeQaToolResult {
  tool_name: KnowledgeQaMcpToolName;
  structured_content: unknown;
  text: string;
}

type ApiEnvelope<T> = {
  data: T;
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    has_next: boolean;
  };
};

export async function callKnowledgeQaTool(
  toolName: KnowledgeQaMcpToolName,
  input: unknown,
  config: KnowledgeQaToolConfig
): Promise<KnowledgeQaToolResult> {
  switch (toolName) {
    case "qa_create_from_conversation":
      return createFromConversation(input, config);
    case "qa_get_review_queue":
      return getReviewQueue(input, config);
    case "qa_confirm_ingestion":
      return confirmIngestion(input, config);
    case "qa_create_practice_session":
      return createPracticeSession(input, config);
    default:
      assertNever(toolName);
  }
}

async function createFromConversation(
  input: unknown,
  config: KnowledgeQaToolConfig
) {
  const parsed = createFromConversationInputSchema.parse(input);
  const response = await requestApi<{
    ingestion_task_id: string;
    status: string;
    topic_suggestion: { domain_name: string; topic_name: string };
    knowledge_points_preview: string[];
    questions_preview: Array<{
      stem: string;
      cognitive_dimension: string;
      difficulty_level: number;
    }>;
    review_url: string;
  }>(config, "/ingestions/external-conversation", {
    method: "POST",
    body: parsed
  });

  return {
    tool_name: "qa_create_from_conversation",
    structured_content: response.data,
    text: [
      "已创建待确认知识沉淀。",
      `建议领域：${response.data.topic_suggestion.domain_name}`,
      `建议主题：${response.data.topic_suggestion.topic_name}`,
      `知识点预览：${response.data.knowledge_points_preview.join("、")}`,
      `题目预览：${response.data.questions_preview.length} 道`,
      `确认链接：${response.data.review_url}`
    ].join("\n")
  } satisfies KnowledgeQaToolResult;
}

async function getReviewQueue(input: unknown, config: KnowledgeQaToolConfig) {
  const parsed = getReviewQueueInputSchema.parse(input);
  const response = await requestApi<Array<{
    review_item_id: string;
    target_type: string;
    status: string;
    review_url: string;
  }>>(
    config,
    `/review-items?status=${encodeURIComponent(parsed.status)}&page_size=${parsed.limit}`,
    { method: "GET" }
  );

  return {
    tool_name: "qa_get_review_queue",
    structured_content: {
      items: response.data,
      pagination: response.pagination
    },
    text:
      response.data.length === 0
        ? "当前没有待确认项。"
        : response.data
            .map(
              (item, index) =>
                `${index + 1}. ${item.target_type} ${item.review_item_id}：${item.status}，${item.review_url}`
            )
            .join("\n")
  } satisfies KnowledgeQaToolResult;
}

async function confirmIngestion(input: unknown, config: KnowledgeQaToolConfig) {
  const parsed = confirmIngestionInputSchema.parse(input);
  const response = await requestApi<{
    review_item_id: string;
    status: string;
    review_url: string;
  }>(config, `/review-items/${encodeURIComponent(parsed.review_item_id)}/confirm`, {
    method: "POST",
    body: {
      edits: parsed.edits,
      include_existing_attempts_in_mastery:
        parsed.include_existing_attempts_in_mastery
    }
  });

  return {
    tool_name: "qa_confirm_ingestion",
    structured_content: response.data,
    text: `已确认待确认项 ${response.data.review_item_id}，当前状态：${response.data.status}。`
  } satisfies KnowledgeQaToolResult;
}

async function createPracticeSession(
  input: unknown,
  config: KnowledgeQaToolConfig
) {
  const parsed = createPracticeSessionInputSchema.parse(input);
  const response = await requestApi<{
    id: string;
    target_type: string;
    target_id: string;
    questions: Array<{
      question_id: string;
      stem: string;
      selection_reason: string;
    }>;
  }>(config, "/practice-sessions", {
    method: "POST",
    body: parsed
  });

  return {
    tool_name: "qa_create_practice_session",
    structured_content: response.data,
    text: [
      `已创建练习会话：${response.data.id}`,
      `目标：${response.data.target_type}:${response.data.target_id}`,
      `题目数：${response.data.questions.length}`,
      ...response.data.questions
        .slice(0, 3)
        .map(
          (item, index) =>
            `${index + 1}. ${item.stem}（原因：${item.selection_reason}）`
        )
    ].join("\n")
  } satisfies KnowledgeQaToolResult;
}

async function requestApi<T>(
  config: KnowledgeQaToolConfig,
  path: string,
  options: {
    method: "GET" | "POST";
    body?: unknown;
  }
): Promise<ApiEnvelope<T>> {
  const fetchImpl = config.fetchImpl ?? fetch;
  const baseUrl = config.apiBaseUrl.replace(/\/+$/, "");
  const response = await fetchImpl(`${baseUrl}${path}`, {
    method: options.method,
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(formatApiError(payload));
  }

  return payload as ApiEnvelope<T>;
}

function formatApiError(payload: unknown) {
  const parsed = z
    .object({
      error: z.object({
        code: z.string(),
        message: z.string()
      })
    })
    .safeParse(payload);

  if (!parsed.success) {
    return "知识问答系统 API 调用失败，请检查服务是否启动和 API Key 是否正确。";
  }

  return `${parsed.data.error.code}: ${parsed.data.error.message}`;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported tool: ${value}`);
}

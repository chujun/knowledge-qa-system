import { z } from "zod";

export const createFromConversationInputSchema = z
  .object({
    source_system: z.string().min(1),
    conversation_id: z.string().optional(),
    context_type: z.enum([
      "full_conversation",
      "recent_turns",
      "selected_excerpt",
      "summary"
    ]),
    conversation_content: z.string().optional(),
    conversation_summary: z.string().optional(),
    source_model_name: z.string().optional(),
    source_model_version: z.string().optional(),
    instruction: z.string().min(1),
    target_topic_id: z.string().optional(),
    target_domain_hint: z.string().optional(),
    direct_confirm: z.boolean().default(false),
    idempotency_key: z.string().optional()
  })
  .refine(
    (value) => Boolean(value.conversation_content || value.conversation_summary),
    {
      message: "conversation_content_or_summary_required",
      path: ["conversation_content"]
    }
  );

export const questionPreviewSchema = z.object({
  stem: z.string(),
  cognitive_dimension: z.string(),
  difficulty_level: z.number().int().min(1).max(5)
});

export const createFromConversationOutputSchema = z.object({
  ingestion_task_id: z.string(),
  status: z.string(),
  topic_suggestion: z.object({
    domain_name: z.string(),
    topic_name: z.string()
  }),
  knowledge_points_preview: z.array(z.string()),
  questions_preview: z.array(questionPreviewSchema),
  review_url: z.string().url(),
  message: z.string()
});

export const getReviewQueueInputSchema = z.object({
  status: z.string().default("pending"),
  limit: z.number().int().min(1).max(50).default(10)
});

export const confirmIngestionInputSchema = z.object({
  review_item_id: z.string().min(1),
  edits: z.record(z.string(), z.unknown()).optional(),
  include_existing_attempts_in_mastery: z.boolean().default(false)
});

export const createPracticeSessionInputSchema = z.object({
  session_type: z.enum(["knowledge_point", "topic", "domain", "error_set"]).default("knowledge_point"),
  target_type: z.enum(["knowledge_point", "topic", "domain"]),
  target_id: z.string().min(1),
  strategy: z
    .object({
      prefer_weak_dimensions: z.boolean().default(true),
      include_error_set: z.boolean().default(true),
      question_count: z.number().int().min(1).max(20).default(5),
      difficulty_min: z.number().int().min(1).max(5).optional(),
      difficulty_max: z.number().int().min(1).max(5).optional()
    })
    .default({})
});

export const mcpToolDefinitions = [
  {
    name: "qa_create_from_conversation",
    description: "从外部 AI Agent 会话内容创建知识问答沉淀任务，并返回待确认链接。",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: "qa_get_review_queue",
    description: "查询知识问答系统的待确认队列，供 Agent 在聊天框中展示待处理项。",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: "qa_confirm_ingestion",
    description: "轻量确认某个待确认项，适用于用户在 Agent 聊天框中明确确认入库。",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: "qa_create_practice_session",
    description: "根据知识点、主题或领域创建针对性练习会话，优先薄弱维度和错误集。",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  }
] as const;

export type CreateFromConversationInput = z.infer<
  typeof createFromConversationInputSchema
>;

export type CreateFromConversationOutput = z.infer<
  typeof createFromConversationOutputSchema
>;

export type KnowledgeQaMcpToolName = (typeof mcpToolDefinitions)[number]["name"];

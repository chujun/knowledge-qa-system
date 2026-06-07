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

export type CreateFromConversationInput = z.infer<
  typeof createFromConversationInputSchema
>;

export type CreateFromConversationOutput = z.infer<
  typeof createFromConversationOutputSchema
>;

import {
  createFromConversationInputSchema,
  createFromConversationOutputSchema
} from "./tools";

describe("MCP tool schemas", () => {
  it("accepts qa_create_from_conversation input with a conversation summary", () => {
    const parsed = createFromConversationInputSchema.parse({
      source_system: "Codex",
      context_type: "summary",
      conversation_summary:
        "讨论了 GitHub Actions workflow 的触发条件、jobs 和 steps。",
      instruction: "生成理解型和应用型问答"
    });

    expect(parsed.direct_confirm).toBe(false);
    expect(parsed.source_system).toBe("Codex");
  });

  it("rejects qa_create_from_conversation input without content or summary", () => {
    expect(() =>
      createFromConversationInputSchema.parse({
        source_system: "Codex",
        context_type: "summary",
        instruction: "生成理解型和应用型问答"
      })
    ).toThrow("conversation_content_or_summary_required");
  });

  it("accepts the required agent response shape", () => {
    expect(
      createFromConversationOutputSchema.parse({
        ingestion_task_id: "ing_mock_001",
        status: "pending_review",
        topic_suggestion: {
          domain_name: "计算机",
          topic_name: "GitHub Actions"
        },
        knowledge_points_preview: ["workflow 触发条件"],
        questions_preview: [
          {
            stem: "jobs 和 steps 的区别是什么？",
            cognitive_dimension: "distinguish",
            difficulty_level: 2
          }
        ],
        review_url: "http://localhost:3000/review/ing_mock_001",
        message: "已生成待确认知识沉淀。"
      })
    ).toMatchObject({
      ingestion_task_id: "ing_mock_001",
      status: "pending_review"
    });
  });
});

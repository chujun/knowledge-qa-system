import { callKnowledgeQaTool } from "./agent-tool-adapter";

describe("knowledge qa agent tool adapter", () => {
  const config = {
    apiBaseUrl: "http://localhost:3000/api/v1",
    apiKey: "test-api-key"
  };

  it("calls external conversation ingestion API", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        data: {
          ingestion_task_id: "ing_1",
          status: "pending_review",
          topic_suggestion: {
            domain_name: "计算机",
            topic_name: "GitHub Actions"
          },
          knowledge_points_preview: ["workflow 触发条件"],
          questions_preview: [
            {
              stem: "workflow 是什么？",
              cognitive_dimension: "understand",
              difficulty_level: 2
            }
          ],
          review_url: "http://localhost:3000/review/ing_1"
        },
        meta: {}
      })
    );

    const result = await callKnowledgeQaTool(
      "qa_create_from_conversation",
      {
        source_system: "Codex",
        context_type: "summary",
        conversation_summary: "讨论 GitHub Actions workflow。",
        instruction: "生成问答"
      },
      { ...config, fetchImpl: fetchImpl as unknown as typeof fetch }
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/ingestions/external-conversation",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-api-key": "test-api-key"
        })
      })
    );
    expect(result.text).toContain("已创建待确认知识沉淀");
    expect(result.text).toContain("确认链接");
  });

  it("calls review queue API", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        data: [
          {
            review_item_id: "rev_1",
            target_type: "ingestion_task",
            status: "pending",
            review_url: "http://localhost:3000/review/rev_1"
          }
        ],
        pagination: {
          page: 1,
          page_size: 5,
          total: 1,
          has_next: false
        },
        meta: {}
      })
    );

    const result = await callKnowledgeQaTool(
      "qa_get_review_queue",
      { status: "pending", limit: 5 },
      { ...config, fetchImpl: fetchImpl as unknown as typeof fetch }
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/review-items?status=pending&page_size=5",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.text).toContain("rev_1");
  });

  it("calls review confirmation API", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        data: {
          review_item_id: "rev_1",
          status: "confirmed",
          review_url: "http://localhost:3000/review/rev_1"
        },
        meta: {}
      })
    );

    const result = await callKnowledgeQaTool(
      "qa_confirm_ingestion",
      {
        review_item_id: "rev_1",
        include_existing_attempts_in_mastery: false
      },
      { ...config, fetchImpl: fetchImpl as unknown as typeof fetch }
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/review-items/rev_1/confirm",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.text).toContain("已确认待确认项");
  });

  it("calls practice session API", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        data: {
          id: "ps_1",
          target_type: "knowledge_point",
          target_id: "kp_1",
          questions: [
            {
              question_id: "q_1",
              stem: "如何应用 workflow？",
              selection_reason: "优先练习薄弱维度：apply"
            }
          ]
        },
        meta: {}
      })
    );

    const result = await callKnowledgeQaTool(
      "qa_create_practice_session",
      {
        target_type: "knowledge_point",
        target_id: "kp_1",
        strategy: {
          question_count: 1
        }
      },
      { ...config, fetchImpl: fetchImpl as unknown as typeof fetch }
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/practice-sessions",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.text).toContain("已创建练习会话");
    expect(result.text).toContain("薄弱维度");
  });

  it("turns API errors into actionable messages", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "API Key 缺失或无效"
          },
          meta: {}
        },
        401
      )
    );

    await expect(
      callKnowledgeQaTool(
        "qa_get_review_queue",
        {},
        { ...config, fetchImpl: fetchImpl as unknown as typeof fetch }
      )
    ).rejects.toThrow("UNAUTHORIZED: API Key 缺失或无效");
  });
});

function jsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  } as Response;
}

import { simulateCreateFromConversationAgentCall } from "./simulated-agent";

describe("simulated MCP/Agent invocation", () => {
  it("creates an external conversation ingestion task from an agent call", () => {
    const result = simulateCreateFromConversationAgentCall({
      source_system: "Codex",
      conversation_id: "codex-local-20260607-001",
      context_type: "summary",
      conversation_summary:
        "讨论了 GitHub Actions workflow 的触发条件、jobs、steps、runner 和 secrets。",
      instruction: "生成理解型和应用型问答",
      target_domain_hint: "计算机",
      direct_confirm: false
    });

    expect(result.output.status).toBe("pending_review");
    expect(result.output.ingestion_task_id).toMatch(/^ing_/);
    expect(result.callRecord).toMatchObject({
      sourceSystem: "Codex",
      aiAgent: "Codex",
      modelName: "chatgpt-5.5",
      callType: "agent_ingestion",
      status: "succeeded"
    });
  });

  it("returns topic suggestion, knowledge points, question previews, and review link", () => {
    const result = simulateCreateFromConversationAgentCall(
      {
        source_system: "Codex",
        conversation_id: "codex-local-20260607-001",
        context_type: "summary",
        conversation_summary:
          "讨论了 GitHub Actions workflow 的触发条件、jobs、steps、runner 和 secrets。",
        instruction: "生成理解型和应用型问答",
        target_domain_hint: "计算机",
        direct_confirm: false
      },
      { appBaseUrl: "http://localhost:3000" }
    );

    expect(result.output.topic_suggestion).toEqual({
      domain_name: "计算机",
      topic_name: "GitHub Actions"
    });
    expect(result.output.knowledge_points_preview.length).toBeGreaterThan(0);
    expect(result.output.questions_preview.length).toBeGreaterThan(0);
    expect(result.output.review_url).toMatch(
      /^http:\/\/localhost:3000\/review\/ing_/
    );
  });
});

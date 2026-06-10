import { describe, expect, it } from "vitest";

import {
  buildQualityCheckMessages,
  buildRuleQualityResult,
  parseProviderQualityCheckResult
} from "./quality-check";

const question = {
  knowledgePointName: "workflow 触发条件",
  cognitiveDimension: "apply" as const,
  difficultyLevel: 3,
  questionType: "subjective",
  stem: "如何为 Node.js 项目配置 push 触发的 workflow？",
  answerText: "在 .github/workflows 中创建 YAML，并在 on.push 中声明分支。",
  explanationText: "答案应说明文件位置、触发事件和分支过滤。",
  rubric: {
    total_score: 100,
    criteria: [{ name: "触发条件准确", score: 40 }]
  }
};

describe("quality check", () => {
  it("builds rule quality results", () => {
    expect(buildRuleQualityResult(question)).toMatchObject({
      has_stem: true,
      has_answer: true,
      has_explanation: true,
      has_rubric: true,
      rubric_total_valid: true,
      cognitive_dimension_valid: true,
      difficulty_valid: true,
      question_type_valid: true
    });
  });

  it("builds a structured Minimax quality prompt", () => {
    const messages = buildQualityCheckMessages(question, buildRuleQualityResult(question));

    expect(messages[0].content).toContain("题目质量审核专家");
    expect(messages[1].content).toContain("相关性");
    expect(messages[1].content).toContain("答案充分性");
    expect(messages[1].content).toContain("workflow 触发条件");
  });

  it("parses a successful Minimax quality check result", () => {
    const result = parseProviderQualityCheckResult(buildRuleQualityResult(question), {
      provider: "minimax",
      modelName: "MiniMax-M3",
      modelVersion: "MiniMax-M3",
      content: JSON.stringify({
        passed: true,
        status: "passed",
        metrics: {
          relevance: 95,
          dimension_match: 92,
          difficulty_match: 88,
          clarity: 90,
          scoreability: 91,
          answer_sufficiency: 89,
          duplication_risk: 12,
          practicality: 93,
          source_support: 86
        },
        issues: [],
        suggestions: [],
        auto_fix_required: false
      }),
      usage: {
        inputTokens: 50,
        outputTokens: 40,
        totalTokens: 90
      },
      latencyMs: 321,
      rawResponseSummary: "{}"
    });

    expect(result.checkerType).toBe("rule_and_minimax");
    expect(result.modelName).toBe("MiniMax-M3");
    expect(result.status).toBe("passed");
    expect(result.aiResult.metrics.scoreability).toBe(91);
  });

  it("marks model warnings as warning and records suggestions", () => {
    const result = parseProviderQualityCheckResult(buildRuleQualityResult(question), {
      provider: "minimax",
      modelName: "MiniMax-M3",
      modelVersion: "MiniMax-M3",
      content: JSON.stringify({
        passed: true,
        status: "warning",
        metrics: {
          relevance: 85,
          dimension_match: 82,
          difficulty_match: 70,
          clarity: 75,
          scoreability: 80,
          answer_sufficiency: 78,
          duplication_risk: 30,
          practicality: 81,
          source_support: 72
        },
        issues: ["难度略低"],
        suggestions: ["增加分支和路径过滤的组合场景"],
        auto_fix_required: false
      }),
      usage: {
        inputTokens: 50,
        outputTokens: 40,
        totalTokens: 90
      },
      latencyMs: 321,
      rawResponseSummary: "{}"
    });

    expect(result.status).toBe("warning");
    expect(result.aiResult.suggestions[0]).toContain("组合场景");
  });
});

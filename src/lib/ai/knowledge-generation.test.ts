import { describe, expect, it } from "vitest";

import {
  buildKnowledgeGenerationMessages,
  parseProviderGeneratedContent
} from "./knowledge-generation";

const point = {
  topicName: "GitHub Actions",
  knowledgeTypeName: "概念",
  knowledgeTypeCode: "concept",
  pointName: "workflow 触发条件",
  pointDescription: "push、pull_request 和 workflow_dispatch 的触发规则",
  suggestedDifficulty: 3
};

describe("knowledge generation", () => {
  it("builds a structured Minimax generation prompt", () => {
    const messages = buildKnowledgeGenerationMessages(point, ["understand", "apply"]);

    expect(messages[0].content).toContain("只返回严格 JSON");
    expect(messages[1].content).toContain("workflow 触发条件");
    expect(messages[1].content).toContain("understand");
    expect(messages[1].content).toContain("apply");
  });

  it("parses provider JSON and aligns questions by requested dimensions", () => {
    const result = parseProviderGeneratedContent(point, ["understand", "apply"], {
      provider: "minimax",
      modelName: "minimax-m2.7-highspeed",
      modelVersion: "minimax-m2.7-highspeed",
      content: JSON.stringify({
        core_explanation: {
          title: "workflow 触发条件核心讲解",
          explanation_text: "workflow 触发条件决定自动化流程何时运行。"
        },
        questions: [
          {
            cognitive_dimension: "apply",
            question_type: "subjective",
            stem: "如何为 Node.js 项目配置 push 触发？",
            answer_text: "在 on.push 中声明分支或路径规则。",
            explanation_text: "回答需要说明 workflow 文件位置和触发条件。",
            rubric: { total_score: 100 }
          },
          {
            cognitive_dimension: "understand",
            question_type: "subjective",
            stem: "什么是 workflow 触发条件？",
            answer_text: "它定义 workflow 运行的事件和约束。",
            explanation_text: "回答需要覆盖事件、分支和路径过滤。",
            rubric: { total_score: 100 }
          }
        ]
      }),
      usage: {
        inputTokens: 20,
        outputTokens: 30,
        totalTokens: 50
      },
      latencyMs: 123,
      rawResponseSummary: "{}"
    });

    expect(result.metadata.provider).toBe("minimax");
    expect(result.questions.map((item) => item.cognitiveDimension)).toEqual([
      "understand",
      "apply"
    ]);
    expect(result.questions[0].stem).toContain("什么是");
  });

  it("rejects provider output missing a requested dimension", () => {
    expect(() =>
      parseProviderGeneratedContent(point, ["understand", "evaluate"], {
        provider: "minimax",
        modelName: "minimax-m2.7-highspeed",
        modelVersion: "minimax-m2.7-highspeed",
        content: JSON.stringify({
          core_explanation: {
            title: "workflow 触发条件核心讲解",
            explanation_text: "workflow 触发条件决定自动化流程何时运行。"
          },
          questions: [
            {
              cognitive_dimension: "understand",
              question_type: "subjective",
              stem: "什么是 workflow 触发条件？",
              answer_text: "它定义 workflow 运行的事件和约束。",
              explanation_text: "回答需要覆盖事件、分支和路径过滤。",
              rubric: { total_score: 100 }
            }
          ]
        }),
        usage: {
          inputTokens: 20,
          outputTokens: 30,
          totalTokens: 50
        },
        latencyMs: 123,
        rawResponseSummary: "{}"
      })
    ).toThrow("model_output_missing_dimension:evaluate");
  });
});

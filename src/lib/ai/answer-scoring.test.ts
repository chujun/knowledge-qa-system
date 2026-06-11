import { describe, expect, it } from "vitest";

import {
  buildAnswerScoringMessages,
  buildAnswerScoringRepairMessages,
  buildMockAnswerScore,
  parseProviderAnswerScore
} from "./answer-scoring";

const question = {
  knowledgePointName: "府兵制",
  stem: "请说明府兵制的运行机制，并分析它为何在唐中后期衰落。",
  cognitiveDimension: "analyze",
  difficultyLevel: 4,
  questionType: "subjective",
  expectedAnswer: "府兵制把兵农合一、轮番宿卫和地方折冲府结合起来，衰落与土地兼并、均田制破坏和募兵兴起有关。",
  explanationText: "核心讲解应覆盖兵农合一、均田制支撑、折冲府组织和唐代制度变迁。",
  rubric: {
    total_score: 100,
    criteria: [
      { name: "机制说明", score: 40 },
      { name: "衰落原因分析", score: 40 },
      { name: "表达结构", score: 20 }
    ]
  },
  userAnswer: "府兵制是兵农合一，平时务农，战时服役。后来土地兼并和均田制破坏，农民承担不起义务，所以逐渐被募兵取代。"
};

describe("answer scoring", () => {
  it("builds a structured Minimax answer scoring prompt", () => {
    const messages = buildAnswerScoringMessages(question);

    expect(messages[0].content).toContain("答题评分专家");
    expect(messages[1].content).toContain("dimension_scores");
    expect(messages[1].content).toContain("weak_points");
    expect(messages[1].content).toContain("next_question_suggestion");
    expect(messages[1].content).toContain("府兵制");
  });

  it("builds a repair prompt for malformed model output", () => {
    const messages = buildAnswerScoringRepairMessages(question, "<think>只有推理，没有 JSON</think>");

    expect(messages[0].content).toContain("不要 <think>");
    expect(messages[1].content).toContain("invalid_output");
    expect(messages[1].content).toContain("府兵制");
  });

  it("parses MiniMax answer scoring JSON with reasoning text", () => {
    const result = parseProviderAnswerScore(question, {
      provider: "minimax",
      modelName: "MiniMax-M3",
      modelVersion: "MiniMax-M3",
      content: `<think>需要按评分规则判断。</think>
      {"score":87,"dimension_scores":{"analyze":86,"understand":90},"feedback":"回答覆盖了制度机制和衰落主因，但可补充折冲府组织。","weak_points":["折冲府组织说明不足"],"reason_tags":["good_coverage"],"next_question_suggestion":"追问府兵制与募兵制的差异。"}`,
      usage: {
        inputTokens: 120,
        outputTokens: 80,
        totalTokens: 200
      },
      latencyMs: 456,
      rawResponseSummary: "{}"
    });

    expect(result.score).toBe(87);
    expect(result.dimensionScores.analyze).toBe(86);
    expect(result.weakPoints[0]).toContain("折冲府");
    expect(result.nextQuestionSuggestion).toContain("募兵制");
    expect(result.metadata.promptVersion).toBe("minimax-answer-scoring-v1");
  });

  it("clamps parsed model scores and fills reason tags when missing", () => {
    const result = parseProviderAnswerScore(question, {
      provider: "minimax",
      modelName: "MiniMax-M3",
      modelVersion: "MiniMax-M3",
      content: JSON.stringify({
        score: 77.8,
        dimension_scores: { analyze: 101, apply: -1 },
        feedback: "分析方向正确，但原因链条还不完整。",
        weak_points: ["原因链条不完整"],
        reason_tags: [],
        next_question_suggestion: null
      }),
      usage: {
        inputTokens: null,
        outputTokens: null,
        totalTokens: null
      },
      latencyMs: 10,
      rawResponseSummary: "{}"
    });

    expect(result.score).toBe(78);
    expect(result.dimensionScores.analyze).toBe(100);
    expect(result.dimensionScores.apply).toBe(0);
    expect(result.reasonTags).toContain("analysis_incomplete");
  });

  it("keeps a deterministic mock fallback when MiniMax is unavailable", () => {
    const result = buildMockAnswerScore(question);

    expect(result.metadata.provider).toBe("mock");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.reasonTags.length).toBeGreaterThan(0);
  });
});

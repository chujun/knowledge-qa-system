import { z } from "zod";

import { parseModelJsonObject } from "@/lib/ai/model-json";
import { createMinimaxProvider } from "@/lib/ai/minimax-provider";
import type { AiProvider, AiProviderResult } from "@/lib/ai/provider";
import { appConfig } from "@/lib/config";

export const answerScoreSchema = z.object({
  score: z.number(),
  dimension_scores: z.record(z.string(), z.number()).default({}),
  feedback: z.string().trim().min(1).max(4000),
  weak_points: z.array(z.string().trim().min(1).max(120)).default([]),
  reason_tags: z.array(z.string().trim().min(1).max(80)).default([]),
  next_question_suggestion: z.string().trim().max(500).nullable().default(null)
});

export interface AnswerScoringQuestionInput {
  knowledgePointName?: string | null;
  stem: string;
  cognitiveDimension: string;
  difficultyLevel: number;
  questionType: string;
  expectedAnswer: string;
  explanationText?: string | null;
  rubric: Record<string, unknown>;
  userAnswer: string;
}

export interface GeneratedAnswerScore {
  score: number;
  dimensionScores: Record<string, number>;
  feedback: string;
  weakPoints: string[];
  reasonTags: string[];
  nextQuestionSuggestion: string | null;
  metadata: {
    provider: string;
    modelName: string;
    modelVersion: string | null;
    aiAgent: string;
    promptVersion: string;
    inputTokens: number | null;
    outputTokens: number | null;
    latencyMs: number;
    rawResponseSummary: string | null;
  };
}

const promptVersion = "minimax-answer-scoring-v1";

export async function scoreAnswerAttempt({
  question,
  provider
}: {
  question: AnswerScoringQuestionInput;
  provider?: AiProvider;
}): Promise<GeneratedAnswerScore> {
  if (
    appConfig.defaultModelProvider !== "minimax" ||
    !appConfig.minimaxApiKeyConfigured
  ) {
    return buildMockAnswerScore(question);
  }

  const activeProvider = provider ?? createMinimaxProvider();
  const result = await activeProvider.generate({
    model: appConfig.defaultModel,
    responseFormat: "json",
    temperature: 0,
    maxTokens: 2000,
    timeoutMs: 240_000,
    messages: buildAnswerScoringMessages(question)
  });

  try {
    return parseProviderAnswerScore(question, result);
  } catch {
    const repairedResult = await activeProvider.generate({
      model: appConfig.defaultModel,
      responseFormat: "json",
      temperature: 0,
      maxTokens: 1200,
      timeoutMs: 240_000,
      messages: buildAnswerScoringRepairMessages(question, result.content)
    });

    return parseProviderAnswerScore(question, repairedResult);
  }
}

export function buildAnswerScoringMessages(question: AnswerScoringQuestionInput) {
  return [
    {
      role: "system" as const,
      content:
        "你是个人知识问答系统的答题评分专家。只返回严格 JSON，不要 Markdown。评分必须依据题干、标准答案、核心讲解和评分规则，不能臆造无关要求。"
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        task: "评估用户答案的掌握程度，并给出可复盘的薄弱点和下一题建议",
        output_schema: {
          score: "0-100 integer",
          dimension_scores: {
            understand: "0-100 optional",
            distinguish: "0-100 optional",
            apply: "0-100 optional",
            analyze: "0-100 optional",
            evaluate: "0-100 optional"
          },
          feedback: "string，简体中文，说明得分原因和改进方向",
          weak_points: ["string，用户当前最需要补齐的知识点"],
          reason_tags: ["string，英文 snake_case，用于错误集聚合"],
          next_question_suggestion: "string | null，下一道针对性追问建议"
        },
        scoring_constraints: {
          language: "简体中文",
          score_range: "0-100",
          use_rubric_first: true,
          penalize_off_topic_answer: true,
          do_not_require_unmentioned_facts: true,
          cognitive_dimension: question.cognitiveDimension
        },
        question
      })
    }
  ];
}

export function buildAnswerScoringRepairMessages(
  question: AnswerScoringQuestionInput,
  invalidOutput: string
) {
  return [
    {
      role: "system" as const,
      content:
        "你是个人知识问答系统的答题评分 JSON 修复器。只返回严格 JSON，不要 Markdown，不要 <think>，不要解释。"
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        task: "上一轮答题评分输出不是合法 JSON。请根据题目、标准答案、评分规则、用户答案和上一轮输出，修复为唯一 JSON 对象。",
        output_schema: {
          score: "0-100 integer",
          dimension_scores: "object，key 为认知维度，value 为 0-100",
          feedback: "string，简体中文",
          weak_points: ["string"],
          reason_tags: ["string，英文 snake_case"],
          next_question_suggestion: "string | null"
        },
        question,
        invalid_output: invalidOutput.slice(0, 4000)
      })
    }
  ];
}

export function parseProviderAnswerScore(
  question: AnswerScoringQuestionInput,
  result: AiProviderResult
): GeneratedAnswerScore {
  const parsedJson = parseModelJsonObject(result.content);
  const parsed = answerScoreSchema.parse(parsedJson);
  const score = clampScore(parsed.score);
  const reasonTags =
    parsed.reason_tags.length > 0
      ? parsed.reason_tags
      : buildReasonTags(score, question.cognitiveDimension);

  return {
    score,
    dimensionScores: normalizeDimensionScores(parsed.dimension_scores),
    feedback: parsed.feedback,
    weakPoints: parsed.weak_points,
    reasonTags,
    nextQuestionSuggestion: parsed.next_question_suggestion,
    metadata: {
      provider: result.provider,
      modelName: result.modelName,
      modelVersion: result.modelVersion,
      aiAgent: appConfig.defaultAgent,
      promptVersion,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      latencyMs: result.latencyMs,
      rawResponseSummary: result.rawResponseSummary
    }
  };
}

export function buildMockAnswerScore(
  question: AnswerScoringQuestionInput
): GeneratedAnswerScore {
  const answer = question.userAnswer.toLowerCase();
  const lengthScore = Math.min(45, Math.floor(question.userAnswer.length / 3));
  const keywordScore = ["概念", "应用", "步骤", "原因", "标准", "workflow", "触发"]
    .filter((keyword) => answer.includes(keyword.toLowerCase())).length * 8;
  const expectedKeywordScore = question.expectedAnswer
    .split(/\s+|，|。|、/)
    .filter((word) => word.length >= 2)
    .slice(0, 5)
    .filter((word) => answer.includes(word.toLowerCase())).length * 5;
  const score = clampScore(25 + lengthScore + keywordScore + expectedKeywordScore);

  return {
    score,
    dimensionScores: {
      [question.cognitiveDimension]: score
    },
    feedback:
      score >= 80
        ? "回答覆盖了核心要点，可以继续挑战更高阶问题。"
        : "回答还需要补充关键概念、边界条件和可验证示例。",
    weakPoints: score >= 80 ? [] : ["关键概念覆盖不足", "缺少可验证示例"],
    reasonTags: buildReasonTags(score, question.cognitiveDimension),
    nextQuestionSuggestion:
      score >= 80 ? "提高难度，追问跨场景应用。" : "围绕缺失要点追加一道理解型追问。",
    metadata: {
      provider: "mock",
      modelName: "mock-minimax-m2.7-highspeed",
      modelVersion: "mock",
      aiAgent: appConfig.defaultAgent,
      promptVersion: "mvp-mock-answer-scoring-v1",
      inputTokens: null,
      outputTokens: null,
      latencyMs: 0,
      rawResponseSummary: null
    }
  };
}

function normalizeDimensionScores(scores: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(scores).map(([dimension, score]) => [dimension, clampScore(score)])
  );
}

function clampScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function buildReasonTags(score: number, dimension: string) {
  if (score >= 80) {
    return ["good_coverage"];
  }

  const tags = ["missing_key_point"];

  if (dimension === "apply") {
    tags.push("application_gap");
  }

  if (dimension === "analyze") {
    tags.push("analysis_incomplete");
  }

  if (dimension === "evaluate") {
    tags.push("evaluation_lacks_criteria");
  }

  return tags;
}

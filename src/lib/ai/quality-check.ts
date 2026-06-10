import { z } from "zod";

import { appConfig } from "@/lib/config";
import { parseModelJsonObject } from "@/lib/ai/model-json";
import { createMinimaxProvider } from "@/lib/ai/minimax-provider";
import type { AiProvider, AiProviderResult } from "@/lib/ai/provider";
import type { GeneratedCognitiveDimension } from "@/lib/ai/knowledge-generation";

export const qualityMetricSchema = z.object({
  relevance: z.number().min(0).max(100),
  dimension_match: z.number().min(0).max(100),
  difficulty_match: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  scoreability: z.number().min(0).max(100),
  answer_sufficiency: z.number().min(0).max(100),
  duplication_risk: z.number().min(0).max(100),
  practicality: z.number().min(0).max(100),
  source_support: z.number().min(0).max(100)
});

export const modelQualityCheckSchema = z.object({
  passed: z.boolean(),
  status: z.enum(["passed", "warning", "failed"]),
  metrics: qualityMetricSchema,
  issues: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  auto_fix_required: z.boolean().default(false)
});

export interface QualityCheckQuestionInput {
  knowledgePointName: string;
  cognitiveDimension: GeneratedCognitiveDimension;
  difficultyLevel: number;
  questionType: string;
  stem: string;
  answerText: string;
  explanationText: string;
  rubric: Record<string, unknown>;
}

export interface GeneratedQualityCheck {
  checkerType: "rule_and_mock_ai" | "rule_and_minimax";
  modelName: string | null;
  aiAgent: string;
  ruleResult: Record<string, unknown>;
  aiResult: z.infer<typeof modelQualityCheckSchema>;
  autoFixCount: number;
  status: "passed" | "warning" | "failed";
  passedAt: Date | null;
  metadata: {
    provider: string;
    modelVersion: string | null;
    promptVersion: string;
    inputTokens: number | null;
    outputTokens: number | null;
    latencyMs: number;
    rawResponseSummary: string | null;
  };
}

const promptVersion = "minimax-question-quality-v1";

export async function checkGeneratedQuestionQuality({
  question,
  provider
}: {
  question: QualityCheckQuestionInput;
  provider?: AiProvider;
}): Promise<GeneratedQualityCheck> {
  const ruleResult = buildRuleQualityResult(question);
  if (
    appConfig.defaultModelProvider !== "minimax" ||
    !appConfig.minimaxApiKeyConfigured
  ) {
    return buildMockQualityCheck(ruleResult);
  }

  const activeProvider = provider ?? createMinimaxProvider();
  const result = await activeProvider.generate({
    model: appConfig.defaultModel,
    responseFormat: "json",
    temperature: 0,
    maxTokens: 2000,
    timeoutMs: 120_000,
    messages: buildQualityCheckMessages(question, ruleResult)
  });

  return parseProviderQualityCheckResult(ruleResult, result);
}

export function buildRuleQualityResult(question: QualityCheckQuestionInput) {
  const rubricTotal = Number(question.rubric.total_score ?? 0);
  const criteria = Array.isArray(question.rubric.criteria)
    ? question.rubric.criteria
    : [];

  return {
    has_stem: question.stem.trim().length > 0,
    has_answer: question.answerText.trim().length > 0,
    has_explanation: question.explanationText.trim().length > 0,
    has_rubric: criteria.length > 0 || rubricTotal > 0,
    rubric_total_valid: rubricTotal === 0 || rubricTotal === 100,
    cognitive_dimension_valid: Boolean(question.cognitiveDimension),
    difficulty_valid: question.difficultyLevel >= 1 && question.difficultyLevel <= 5,
    question_type_valid: ["subjective", "single_choice"].includes(question.questionType)
  };
}

export function buildQualityCheckMessages(
  question: QualityCheckQuestionInput,
  ruleResult: Record<string, unknown>
) {
  return [
    {
      role: "system" as const,
      content:
        "你是个人知识问答系统的题目质量审核专家。只返回严格 JSON，不要 Markdown。你需要从学习掌握评估角度判断题目、答案和评分规则是否可靠。"
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        task: "校验题目、答案、评分规则和核心知识点讲解支撑是否足够",
        output_schema: {
          passed: "boolean",
          status: "passed | warning | failed",
          metrics: {
            relevance: "0-100",
            dimension_match: "0-100",
            difficulty_match: "0-100",
            clarity: "0-100",
            scoreability: "0-100",
            answer_sufficiency: "0-100",
            duplication_risk: "0-100，越高表示越重复或价值越低",
            practicality: "0-100",
            source_support: "0-100"
          },
          issues: ["string"],
          suggestions: ["string"],
          auto_fix_required: "boolean"
        },
        quality_dimensions: [
          "相关性",
          "认知维度匹配",
          "难度匹配",
          "清晰度",
          "可评分性",
          "答案充分性",
          "重复度",
          "实用性",
          "来源支撑"
        ],
        rule_result: ruleResult,
        question
      })
    }
  ];
}

export function parseProviderQualityCheckResult(
  ruleResult: Record<string, unknown>,
  result: AiProviderResult
): GeneratedQualityCheck {
  const parsedJson = parseJsonObject(result.content);
  const parsed = modelQualityCheckSchema.parse(parsedJson);
  const status = deriveQualityStatus(ruleResult, parsed.status, parsed.passed);

  return {
    checkerType: "rule_and_minimax",
    modelName: result.modelName,
    aiAgent: appConfig.defaultAgent,
    ruleResult,
    aiResult: parsed,
    autoFixCount: parsed.auto_fix_required ? 1 : 0,
    status,
    passedAt: status === "passed" ? new Date() : null,
    metadata: {
      provider: result.provider,
      modelVersion: result.modelVersion,
      promptVersion,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      latencyMs: result.latencyMs,
      rawResponseSummary: result.rawResponseSummary
    }
  };
}

function buildMockQualityCheck(ruleResult: Record<string, unknown>): GeneratedQualityCheck {
  const status = deriveQualityStatus(ruleResult, "passed", true);
  const aiResult = {
    passed: status === "passed",
    status,
    metrics: {
      relevance: 90,
      dimension_match: 90,
      difficulty_match: 85,
      clarity: 90,
      scoreability: 88,
      answer_sufficiency: 88,
      duplication_risk: 10,
      practicality: 85,
      source_support: 80
    },
    issues: [],
    suggestions: [],
    auto_fix_required: false
  } satisfies z.infer<typeof modelQualityCheckSchema>;

  return {
    checkerType: "rule_and_mock_ai",
    modelName: "mock-minimax-m2.7-highspeed",
    aiAgent: appConfig.defaultAgent,
    ruleResult,
    aiResult,
    autoFixCount: 0,
    status,
    passedAt: status === "passed" ? new Date() : null,
    metadata: {
      provider: "mock",
      modelVersion: "mock",
      promptVersion: "mvp-mock-quality-v1",
      inputTokens: null,
      outputTokens: null,
      latencyMs: 0,
      rawResponseSummary: null
    }
  };
}

function deriveQualityStatus(
  ruleResult: Record<string, unknown>,
  modelStatus: "passed" | "warning" | "failed",
  modelPassed: boolean
) {
  const rulePassed = Object.values(ruleResult).every((value) => value === true);
  if (!rulePassed || !modelPassed || modelStatus === "failed") {
    return "failed";
  }
  if (modelStatus === "warning") {
    return "warning";
  }
  return "passed";
}

function parseJsonObject(content: string) {
  return parseModelJsonObject(content);
}

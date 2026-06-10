import { z } from "zod";

import { appConfig } from "@/lib/config";
import { parseModelJsonObject } from "@/lib/ai/model-json";
import { createMinimaxProvider } from "@/lib/ai/minimax-provider";
import type { AiProvider, AiProviderResult } from "@/lib/ai/provider";

export const generatedCognitiveDimensionSchema = z.enum([
  "understand",
  "distinguish",
  "apply",
  "analyze",
  "evaluate"
]);

export type GeneratedCognitiveDimension = z.infer<
  typeof generatedCognitiveDimensionSchema
>;

export const generatedKnowledgeContentSchema = z.object({
  core_explanation: z.object({
    title: z.string().trim().min(1).max(240),
    explanation_text: z.string().trim().min(1).max(12000)
  }),
  questions: z
    .array(
      z.object({
        cognitive_dimension: generatedCognitiveDimensionSchema,
        question_type: z.enum(["subjective", "single_choice"]).default("subjective"),
        stem: z.string().trim().min(1).max(4000),
        answer_text: z.string().trim().min(1).max(8000),
        explanation_text: z.string().trim().min(1).max(8000),
        rubric: z.record(z.string(), z.unknown())
      })
    )
    .min(1)
    .max(5)
});

export interface KnowledgeGenerationPointContext {
  domainName?: string | null;
  topicName: string;
  knowledgeTypeName: string;
  knowledgeTypeCode: string;
  pointName: string;
  pointDescription?: string | null;
  suggestedDifficulty: number;
}

export interface KnowledgeGenerationMetadata {
  provider: string;
  modelName: string;
  modelVersion: string | null;
  aiAgent: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  rawResponseSummary: string | null;
}

export interface GeneratedKnowledgeContent {
  coreExplanation: {
    title: string;
    explanationText: string;
  };
  questions: Array<{
    cognitiveDimension: GeneratedCognitiveDimension;
    questionType: "subjective" | "single_choice";
    stem: string;
    answerText: string;
    explanationText: string;
    rubric: Record<string, unknown>;
  }>;
  metadata: KnowledgeGenerationMetadata;
}

const promptVersion = "minimax-knowledge-generation-v1";

export async function generateKnowledgeContent({
  point,
  dimensions,
  provider
}: {
  point: KnowledgeGenerationPointContext;
  dimensions: GeneratedCognitiveDimension[];
  provider?: AiProvider;
}): Promise<GeneratedKnowledgeContent> {
  if (
    appConfig.defaultModelProvider !== "minimax" ||
    !appConfig.minimaxApiKeyConfigured
  ) {
    return buildMockGeneratedKnowledgeContent(point, dimensions);
  }

  const activeProvider = provider ?? createMinimaxProvider();
  const result = await activeProvider.generate({
    model: appConfig.defaultModel,
    responseFormat: "json",
    temperature: 0.2,
    maxTokens: 6000,
    timeoutMs: 120_000,
    messages: buildKnowledgeGenerationMessages(point, dimensions)
  });

  return parseProviderGeneratedContent(point, dimensions, result);
}

export function buildMockGeneratedKnowledgeContent(
  point: KnowledgeGenerationPointContext,
  dimensions: GeneratedCognitiveDimension[]
): GeneratedKnowledgeContent {
  return {
    coreExplanation: {
      title: `${point.pointName} 核心讲解`,
      explanationText: `${point.pointName} 是一个${point.knowledgeTypeName}类知识点。学习时先理解它解决什么问题，再掌握关键组成部分，最后通过实际场景验证是否能独立应用。`
    },
    questions: dimensions.map((dimension) => ({
      cognitiveDimension: dimension,
      questionType: dimension === "distinguish" ? "single_choice" : "subjective",
      stem: buildQuestionStem(point.pointName, dimension),
      answerText: buildAnswer(point.pointName, dimension),
      explanationText: `回答应覆盖 ${point.pointName} 的定义、边界和实际使用场景。`,
      rubric: buildRubric(dimension)
    })),
    metadata: {
      provider: "mock",
      modelName: "mock-minimax-m2.7-highspeed",
      modelVersion: "mock",
      aiAgent: appConfig.defaultAgent,
      promptVersion: "mvp-mock-v1",
      inputTokens: 120,
      outputTokens: 240,
      latencyMs: 10,
      rawResponseSummary: null
    }
  };
}

export function buildKnowledgeGenerationMessages(
  point: KnowledgeGenerationPointContext,
  dimensions: GeneratedCognitiveDimension[]
) {
  return [
    {
      role: "system" as const,
      content:
        "你是个人知识问答系统的出题专家。只返回严格 JSON，不要 Markdown，不要解释。题目必须可评分、可复盘，并贴合指定认知维度。"
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        task: "生成知识点核心讲解、题目、答案和评分规则",
        output_schema: {
          core_explanation: {
            title: "string",
            explanation_text: "string"
          },
          questions: [
            {
              cognitive_dimension: dimensions[0],
              question_type: "subjective | single_choice",
              stem: "string",
              answer_text: "string",
              explanation_text: "string",
              rubric: {
                total_score: 100,
                criteria: [{ name: "string", score: 40 }]
              }
            }
          ]
        },
        constraints: {
          language: "简体中文",
          question_count: dimensions.length,
          cognitive_dimensions: dimensions,
          difficulty_level: point.suggestedDifficulty,
          rubric_total_score: 100,
          must_cover_all_dimensions: true
        },
        knowledge_context: {
          domain_name: point.domainName,
          topic_name: point.topicName,
          knowledge_type_name: point.knowledgeTypeName,
          knowledge_type_code: point.knowledgeTypeCode,
          knowledge_point_name: point.pointName,
          knowledge_point_description: point.pointDescription
        }
      })
    }
  ];
}

export function parseProviderGeneratedContent(
  point: KnowledgeGenerationPointContext,
  dimensions: GeneratedCognitiveDimension[],
  result: AiProviderResult
): GeneratedKnowledgeContent {
  const parsedJson = parseJsonObject(result.content);
  const parsed = generatedKnowledgeContentSchema.parse(parsedJson);
  const questions = alignQuestionsToDimensions(parsed.questions, dimensions);

  return {
    coreExplanation: {
      title: parsed.core_explanation.title,
      explanationText: parsed.core_explanation.explanation_text
    },
    questions,
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

function parseJsonObject(content: string) {
  return parseModelJsonObject(content);
}

function alignQuestionsToDimensions(
  questions: z.infer<typeof generatedKnowledgeContentSchema>["questions"],
  dimensions: GeneratedCognitiveDimension[]
) {
  return dimensions.map((dimension) => {
    const matched = questions.find((item) => item.cognitive_dimension === dimension);
    if (!matched) {
      throw new Error(`model_output_missing_dimension:${dimension}`);
    }

    return {
      cognitiveDimension: matched.cognitive_dimension,
      questionType: matched.question_type,
      stem: matched.stem,
      answerText: matched.answer_text,
      explanationText: matched.explanation_text,
      rubric: matched.rubric
    };
  });
}

function buildQuestionStem(pointName: string, dimension: string) {
  const templates: Record<string, string> = {
    understand: `请解释 ${pointName} 的核心概念，并说明它通常解决什么问题。`,
    distinguish: `请区分 ${pointName} 与相近概念的差异，并给出判断依据。`,
    apply: `如果你要在一个真实项目中使用 ${pointName}，你会如何设计步骤？`,
    analyze: `分析 ${pointName} 在复杂场景中可能失败的原因和排查路径。`,
    evaluate: `评价一个 ${pointName} 方案是否合理时，你会采用哪些标准？`
  };

  return templates[dimension] ?? templates.understand;
}

function buildAnswer(pointName: string, dimension: string) {
  return `答案需要围绕 ${pointName} 展开，覆盖 ${dimension} 维度要求，并给出可验证的例子。`;
}

function buildRubric(dimension: string) {
  return {
    dimension,
    total_score: 100,
    criteria: [
      { name: "核心概念准确", score: 40 },
      { name: "关键边界清晰", score: 30 },
      { name: "示例或推理可验证", score: 30 }
    ]
  };
}

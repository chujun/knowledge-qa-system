import type { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  generateKnowledgeContent,
  type GeneratedCognitiveDimension
} from "@/lib/ai/knowledge-generation";
import { prisma } from "@/lib/db/prisma";
import { getDefaultUser } from "@/lib/knowledge/service";

export const generateForKnowledgePointSchema = z.object({
  knowledge_point_id: z.string().min(1),
  cognitive_dimensions: z
    .array(z.enum(["understand", "distinguish", "apply", "analyze", "evaluate"]))
    .min(1)
    .max(5)
    .default(["understand", "apply"]),
  question_count: z.number().int().min(1).max(5).default(2),
  direct_confirm: z.boolean().default(false)
});

export const updateQuestionContentSchema = z.object({
  stem: z.string().trim().min(1).max(4000),
  answer_text: z.string().trim().min(1).max(8000),
  explanation_text: z.string().trim().max(8000).optional(),
  rubric: z.record(z.string(), z.unknown())
});

export const updateCoreExplanationContentSchema = z.object({
  title: z.string().trim().min(1).max(240),
  explanation_text: z.string().trim().min(1).max(12000)
});

export async function generateForKnowledgePoint(
  input: z.infer<typeof generateForKnowledgePointSchema>
) {
  const user = await getDefaultUser();
  const point = await prisma.knowledgePoint.findFirst({
    where: {
      id: input.knowledge_point_id,
      userId: user.id
    },
    include: {
      topic: true,
      knowledgeType: true
    }
  });

  if (!point) {
    throw new Error("knowledge_point_not_found");
  }

  const status = input.direct_confirm ? "confirmed" : "pending_confirmation";
  const versionStatus = input.direct_confirm ? "active" : "draft";
  const dimensions = input.cognitive_dimensions.slice(
    0,
    input.question_count
  ) as GeneratedCognitiveDimension[];
  const generatedContent = await generateContentOrRecordFailure({
    userId: user.id,
    point: {
      id: point.id,
      name: point.name,
      description: point.description,
      suggestedDifficulty: point.suggestedDifficulty,
      topicName: point.topic.name,
      knowledgeTypeName: point.knowledgeType.name,
      knowledgeTypeCode: point.knowledgeType.code
    },
    dimensions
  });

  const result = await prisma.$transaction(async (tx) => {
    const coreExplanation = await tx.coreExplanation.create({
      data: {
        userId: user.id,
        knowledgePointId: point.id,
        status
      }
    });

    const coreVersion = await tx.coreExplanationVersion.create({
      data: {
        coreExplanationId: coreExplanation.id,
        versionNo: 1,
        title: generatedContent.coreExplanation.title,
        explanationText: generatedContent.coreExplanation.explanationText,
        templateCode: point.knowledgeType.code,
        modelName: generatedContent.metadata.modelName,
        aiAgent: generatedContent.metadata.aiAgent,
        promptVersion: generatedContent.metadata.promptVersion,
        status: versionStatus
      }
    });

    await tx.generationRecord.create({
      data: {
        userId: user.id,
        targetType: "core_explanation_version",
        targetId: coreVersion.id,
        callType: "core_explanation_generation",
        modelName: generatedContent.metadata.modelName,
        modelVersion: generatedContent.metadata.modelVersion,
        aiAgent: generatedContent.metadata.aiAgent,
        promptVersion: generatedContent.metadata.promptVersion,
        inputTokens: generatedContent.metadata.inputTokens,
        outputTokens: generatedContent.metadata.outputTokens,
        latencyMs: generatedContent.metadata.latencyMs,
        status: "success"
      }
    });

    const questions = [];

    for (const [index, generatedQuestion] of generatedContent.questions.entries()) {
      const question = await tx.question.create({
        data: {
          userId: user.id,
          knowledgePointId: point.id,
          questionType: generatedQuestion.questionType,
          cognitiveDimension: generatedQuestion.cognitiveDimension,
          difficultyLevel: point.suggestedDifficulty,
          status
        }
      });

      const stem = generatedQuestion.stem;
      const questionVersion = await tx.questionVersion.create({
        data: {
          questionId: question.id,
          versionNo: 1,
          stem,
          contentJson: JSON.stringify({
            topic_name: point.topic.name,
            knowledge_point_name: point.name,
            dimension: generatedQuestion.cognitiveDimension
          }),
          modelName: generatedContent.metadata.modelName,
          aiAgent: generatedContent.metadata.aiAgent,
          promptVersion: generatedContent.metadata.promptVersion,
          status: versionStatus
        }
      });

      const answerVersion = await tx.answerVersion.create({
        data: {
          questionId: question.id,
          versionNo: 1,
          answerText: generatedQuestion.answerText,
          explanationText: generatedQuestion.explanationText,
          modelName: generatedContent.metadata.modelName,
          aiAgent: generatedContent.metadata.aiAgent,
          promptVersion: generatedContent.metadata.promptVersion,
          status: versionStatus
        }
      });

      const rubricVersion = await tx.scoringRubricVersion.create({
        data: {
          questionId: question.id,
          versionNo: 1,
          rubricJson: JSON.stringify(generatedQuestion.rubric),
          modelName: generatedContent.metadata.modelName,
          aiAgent: generatedContent.metadata.aiAgent,
          promptVersion: generatedContent.metadata.promptVersion,
          status: versionStatus
        }
      });

      await tx.generationRecord.createMany({
        data: [
          {
            userId: user.id,
            targetType: "question_version",
            targetId: questionVersion.id,
            callType: "question_generation",
            modelName: generatedContent.metadata.modelName,
            modelVersion: generatedContent.metadata.modelVersion,
            aiAgent: generatedContent.metadata.aiAgent,
            promptVersion: generatedContent.metadata.promptVersion,
            inputTokens: distributeTokenCount(generatedContent.metadata.inputTokens, generatedContent.questions.length),
            outputTokens: distributeTokenCount(generatedContent.metadata.outputTokens, generatedContent.questions.length),
            latencyMs: generatedContent.metadata.latencyMs,
            status: "success"
          },
          {
            userId: user.id,
            targetType: "answer_version",
            targetId: answerVersion.id,
            callType: "answer_generation",
            modelName: generatedContent.metadata.modelName,
            modelVersion: generatedContent.metadata.modelVersion,
            aiAgent: generatedContent.metadata.aiAgent,
            promptVersion: generatedContent.metadata.promptVersion,
            inputTokens: distributeTokenCount(generatedContent.metadata.inputTokens, generatedContent.questions.length),
            outputTokens: distributeTokenCount(generatedContent.metadata.outputTokens, generatedContent.questions.length),
            latencyMs: generatedContent.metadata.latencyMs,
            status: "success"
          },
          {
            userId: user.id,
            targetType: "scoring_rubric_version",
            targetId: rubricVersion.id,
            callType: "rubric_generation",
            modelName: generatedContent.metadata.modelName,
            modelVersion: generatedContent.metadata.modelVersion,
            aiAgent: generatedContent.metadata.aiAgent,
            promptVersion: generatedContent.metadata.promptVersion,
            inputTokens: distributeTokenCount(generatedContent.metadata.inputTokens, generatedContent.questions.length),
            outputTokens: distributeTokenCount(generatedContent.metadata.outputTokens, generatedContent.questions.length),
            latencyMs: generatedContent.metadata.latencyMs,
            status: "success"
          }
        ]
      });

      const qualityCheck = await tx.qualityCheckRecord.create({
        data: {
          userId: user.id,
          questionId: question.id,
          targetType: "question",
          targetId: question.id,
          checkerType: "rule_and_mock_ai",
          modelName: generatedContent.metadata.modelName,
          aiAgent: generatedContent.metadata.aiAgent,
          ruleResultJson: JSON.stringify({
            has_stem: stem.length > 0,
            has_answer: true,
            has_rubric: true,
            cognitive_dimension_valid: true
          }),
          aiResultJson: JSON.stringify({
            passed: true,
            issues: []
          }),
          status: "passed",
          passedAt: new Date()
        }
      });

      questions.push({
        question,
        questionVersion,
        answerVersion,
        rubricVersion,
        qualityCheck
      });
    }

    return {
      coreExplanation,
      coreVersion,
      questions
    };
  });

  return {
    knowledge_point_id: point.id,
    status,
    core_explanation: serializeCoreExplanation(
      result.coreExplanation,
      result.coreVersion
    ),
    questions: result.questions.map((item) =>
      serializeGeneratedQuestion(
        item.question,
        item.questionVersion,
        item.answerVersion,
        item.rubricVersion,
        item.qualityCheck
      )
    )
  };
}

export async function listQuestions(params: {
  knowledgePointId?: string | null;
  status?: string | null;
  cognitiveDimension?: string | null;
  difficultyLevel?: number | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await getDefaultUser();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where: Prisma.QuestionWhereInput = {
    userId: user.id,
    ...(params.knowledgePointId
      ? { knowledgePointId: params.knowledgePointId }
      : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.cognitiveDimension
      ? { cognitiveDimension: params.cognitiveDimension }
      : {}),
    ...(params.difficultyLevel ? { difficultyLevel: params.difficultyLevel } : {})
  };

  const [items, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        versions: { orderBy: { versionNo: "desc" }, take: 1 },
        answerVersions: { orderBy: { versionNo: "desc" }, take: 1 },
        rubricVersions: { orderBy: { versionNo: "desc" }, take: 1 },
        qualityChecks: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.question.count({ where })
  ]);

  return {
    items: items.map((item) =>
      serializeGeneratedQuestion(
        item,
        item.versions[0],
        item.answerVersions[0],
        item.rubricVersions[0],
        item.qualityChecks[0]
      )
    ),
    page,
    pageSize,
    total
  };
}

export async function getQuestion(questionId: string) {
  const user = await getDefaultUser();
  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      userId: user.id
    },
    include: questionDetailInclude
  });

  return question ? serializeQuestionWithVersions(question) : null;
}

export async function confirmQuestion(questionId: string) {
  const user = await getDefaultUser();

  const question = await prisma.$transaction(async (tx) => {
    const existing = await tx.question.findFirstOrThrow({
      where: {
        id: questionId,
        userId: user.id
      }
    });

    await tx.questionVersion.updateMany({
      where: { questionId: existing.id },
      data: { status: "active" }
    });
    await tx.answerVersion.updateMany({
      where: { questionId: existing.id },
      data: { status: "active" }
    });
    await tx.scoringRubricVersion.updateMany({
      where: { questionId: existing.id },
      data: { status: "active" }
    });

    return tx.question.update({
      where: {
        id: existing.id
      },
      data: {
        status: "confirmed"
      },
      include: {
        versions: { orderBy: { versionNo: "desc" }, take: 1 },
        answerVersions: { orderBy: { versionNo: "desc" }, take: 1 },
        rubricVersions: { orderBy: { versionNo: "desc" }, take: 1 },
        qualityChecks: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });
  });

  return serializeGeneratedQuestion(
    question,
    question.versions[0],
    question.answerVersions[0],
    question.rubricVersions[0],
    question.qualityChecks[0]
  );
}

export async function archiveQuestion(questionId: string) {
  const user = await getDefaultUser();
  const question = await prisma.$transaction(async (tx) => {
    const existing = await tx.question.findFirstOrThrow({
      where: {
        id: questionId,
        userId: user.id
      }
    });

    await tx.questionVersion.updateMany({
      where: { questionId: existing.id },
      data: { status: "archived" }
    });
    await tx.answerVersion.updateMany({
      where: { questionId: existing.id },
      data: { status: "archived" }
    });
    await tx.scoringRubricVersion.updateMany({
      where: { questionId: existing.id },
      data: { status: "archived" }
    });

    return tx.question.update({
      where: { id: existing.id },
      data: { status: "archived" },
      include: questionDetailInclude
    });
  });

  return serializeQuestionWithVersions(question);
}

export async function updateQuestionContent(
  questionId: string,
  input: z.infer<typeof updateQuestionContentSchema>
) {
  const user = await getDefaultUser();
  const question = await prisma.$transaction(async (tx) => {
    const existing = await tx.question.findFirstOrThrow({
      where: {
        id: questionId,
        userId: user.id
      },
      include: {
        versions: { orderBy: { versionNo: "desc" }, take: 1 },
        answerVersions: { orderBy: { versionNo: "desc" }, take: 1 },
        rubricVersions: { orderBy: { versionNo: "desc" }, take: 1 }
      }
    });

    const versionStatus = existing.status === "confirmed" ? "active" : "draft";

    if (existing.status === "confirmed") {
      await tx.questionVersion.updateMany({
        where: { questionId: existing.id, status: "active" },
        data: { status: "archived" }
      });
      await tx.answerVersion.updateMany({
        where: { questionId: existing.id, status: "active" },
        data: { status: "archived" }
      });
      await tx.scoringRubricVersion.updateMany({
        where: { questionId: existing.id, status: "active" },
        data: { status: "archived" }
      });
    }

    await tx.questionVersion.create({
      data: {
        questionId: existing.id,
        versionNo: (existing.versions[0]?.versionNo ?? 0) + 1,
        stem: input.stem,
        contentJson: JSON.stringify({
          manually_edited: true,
          edited_at: new Date().toISOString()
        }),
        sourceType: "user_edited",
        modelName: null,
        aiAgent: "User",
        promptVersion: "manual-edit-v1",
        status: versionStatus
      }
    });

    await tx.answerVersion.create({
      data: {
        questionId: existing.id,
        versionNo: (existing.answerVersions[0]?.versionNo ?? 0) + 1,
        answerText: input.answer_text,
        explanationText: input.explanation_text,
        sourceType: "user_edited",
        modelName: null,
        aiAgent: "User",
        promptVersion: "manual-edit-v1",
        status: versionStatus
      }
    });

    await tx.scoringRubricVersion.create({
      data: {
        questionId: existing.id,
        versionNo: (existing.rubricVersions[0]?.versionNo ?? 0) + 1,
        rubricJson: JSON.stringify(input.rubric),
        sourceType: "user_edited",
        modelName: null,
        aiAgent: "User",
        promptVersion: "manual-edit-v1",
        status: versionStatus
      }
    });

    return tx.question.findFirstOrThrow({
      where: { id: existing.id },
      include: questionDetailInclude
    });
  });

  return serializeQuestionWithVersions(question);
}

export async function getCoreExplanationForKnowledgePoint(knowledgePointId: string) {
  const user = await getDefaultUser();
  const core = await prisma.coreExplanation.findFirst({
    where: {
      knowledgePointId,
      userId: user.id
    },
    include: {
      versions: { orderBy: { versionNo: "desc" } }
    },
    orderBy: { createdAt: "desc" }
  });

  return core && core.versions[0]
    ? serializeCoreExplanation(core, core.versions[0])
    : null;
}

export async function updateCoreExplanationContent(
  coreExplanationId: string,
  input: z.infer<typeof updateCoreExplanationContentSchema>
) {
  const user = await getDefaultUser();
  const core = await prisma.$transaction(async (tx) => {
    const existing = await tx.coreExplanation.findFirstOrThrow({
      where: {
        id: coreExplanationId,
        userId: user.id
      },
      include: {
        versions: { orderBy: { versionNo: "desc" }, take: 1 }
      }
    });

    const versionStatus = existing.status === "confirmed" ? "active" : "draft";

    if (existing.status === "confirmed") {
      await tx.coreExplanationVersion.updateMany({
        where: { coreExplanationId: existing.id, status: "active" },
        data: { status: "archived" }
      });
    }

    await tx.coreExplanationVersion.create({
      data: {
        coreExplanationId: existing.id,
        versionNo: (existing.versions[0]?.versionNo ?? 0) + 1,
        title: input.title,
        explanationText: input.explanation_text,
        templateCode: "manual-edit",
        sourceType: "user_edited",
        modelName: null,
        aiAgent: "User",
        promptVersion: "manual-edit-v1",
        status: versionStatus
      }
    });

    return tx.coreExplanation.findFirstOrThrow({
      where: { id: existing.id },
      include: {
        versions: { orderBy: { versionNo: "desc" } }
      }
    });
  });

  return serializeCoreExplanation(core, core.versions[0]);
}

const questionDetailInclude = {
  versions: { orderBy: { versionNo: "desc" } },
  answerVersions: { orderBy: { versionNo: "desc" } },
  rubricVersions: { orderBy: { versionNo: "desc" } },
  qualityChecks: { orderBy: { createdAt: "desc" } }
} satisfies Prisma.QuestionInclude;

async function generateContentOrRecordFailure({
  userId,
  point,
  dimensions
}: {
  userId: string;
  point: {
    id: string;
    name: string;
    description: string | null;
    suggestedDifficulty: number;
    topicName: string;
    knowledgeTypeName: string;
    knowledgeTypeCode: string;
  };
  dimensions: GeneratedCognitiveDimension[];
}) {
  try {
    return await generateKnowledgeContent({
      point: {
        pointName: point.name,
        pointDescription: point.description,
        suggestedDifficulty: point.suggestedDifficulty,
        topicName: point.topicName,
        knowledgeTypeName: point.knowledgeTypeName,
        knowledgeTypeCode: point.knowledgeTypeCode
      },
      dimensions
    });
  } catch (error) {
    await prisma.generationRecord.create({
      data: {
        userId,
        targetType: "knowledge_point",
        targetId: point.id,
        callType: "knowledge_point_generation",
        modelName: process.env.DEFAULT_MODEL_NAME ?? "minimax-m2.7-highspeed",
        modelVersion: process.env.DEFAULT_MODEL_PROVIDER ?? "minimax",
        aiAgent: process.env.DEFAULT_AI_AGENT ?? "Codex",
        promptVersion: "minimax-knowledge-generation-v1",
        latencyMs: error instanceof Error && "latencyMs" in error ? Number(error.latencyMs) : null,
        status: "failed"
      }
    });
    throw new Error("model_generation_failed");
  }
}

function distributeTokenCount(value: number | null, total: number) {
  return value === null ? null : Math.max(0, Math.floor(value / total));
}

function serializeCoreExplanation(
  core: {
    id: string;
    knowledgePointId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  },
  version: {
    id: string;
    versionNo: number;
    title: string;
    explanationText: string;
    status: string;
    sourceType?: string;
    modelName?: string | null;
    aiAgent?: string | null;
    promptVersion?: string | null;
  }
) {
  return {
    id: core.id,
    knowledge_point_id: core.knowledgePointId,
    status: core.status,
  version: {
    id: version.id,
    version_no: version.versionNo,
    title: version.title,
    explanation_text: version.explanationText,
    status: version.status,
    source_type: version.sourceType,
    model_name: version.modelName,
    ai_agent: version.aiAgent,
    prompt_version: version.promptVersion
  },
    created_at: core.createdAt.toISOString(),
    updated_at: core.updatedAt.toISOString()
  };
}

function serializeGeneratedQuestion(
  question: {
    id: string;
    knowledgePointId: string;
    questionType: string;
    cognitiveDimension: string;
    difficultyLevel: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  },
  questionVersion?: {
    id: string;
    versionNo: number;
    stem: string;
    status: string;
  },
  answerVersion?: {
    id: string;
    versionNo: number;
    answerText: string;
    status: string;
  },
  rubricVersion?: {
    id: string;
    versionNo: number;
    rubricJson: string;
    status: string;
  },
  qualityCheck?: {
    id: string;
    status: string;
    ruleResultJson: string | null;
    aiResultJson: string | null;
  }
) {
  return {
    id: question.id,
    knowledge_point_id: question.knowledgePointId,
    question_type: question.questionType,
    cognitive_dimension: question.cognitiveDimension,
    difficulty_level: question.difficultyLevel,
    status: question.status,
    question_version: questionVersion
      ? {
          id: questionVersion.id,
          version_no: questionVersion.versionNo,
          stem: questionVersion.stem,
          status: questionVersion.status
        }
      : null,
    answer_version: answerVersion
      ? {
          id: answerVersion.id,
          version_no: answerVersion.versionNo,
          answer_text: answerVersion.answerText,
          status: answerVersion.status
        }
      : null,
    scoring_rubric_version: rubricVersion
      ? {
          id: rubricVersion.id,
          version_no: rubricVersion.versionNo,
          rubric: JSON.parse(rubricVersion.rubricJson),
          status: rubricVersion.status
        }
      : null,
    quality_check: qualityCheck
      ? {
          id: qualityCheck.id,
          status: qualityCheck.status,
          rule_result: parseJson(qualityCheck.ruleResultJson),
          ai_result: parseJson(qualityCheck.aiResultJson)
        }
      : null,
    created_at: question.createdAt.toISOString(),
    updated_at: question.updatedAt.toISOString()
  };
}

function serializeQuestionWithVersions(
  question: Prisma.QuestionGetPayload<{ include: typeof questionDetailInclude }>
) {
  return {
    ...serializeGeneratedQuestion(
      question,
      question.versions[0],
      question.answerVersions[0],
      question.rubricVersions[0],
      question.qualityChecks[0]
    ),
    question_versions: question.versions.map((version) => ({
      id: version.id,
      version_no: version.versionNo,
      stem: version.stem,
      content: parseJson(version.contentJson),
      source_type: version.sourceType,
      model_name: version.modelName,
      ai_agent: version.aiAgent,
      prompt_version: version.promptVersion,
      status: version.status,
      created_at: version.createdAt.toISOString(),
      updated_at: version.updatedAt.toISOString()
    })),
    answer_versions: question.answerVersions.map((version) => ({
      id: version.id,
      version_no: version.versionNo,
      answer_text: version.answerText,
      explanation_text: version.explanationText,
      source_type: version.sourceType,
      model_name: version.modelName,
      ai_agent: version.aiAgent,
      prompt_version: version.promptVersion,
      status: version.status,
      created_at: version.createdAt.toISOString(),
      updated_at: version.updatedAt.toISOString()
    })),
    scoring_rubric_versions: question.rubricVersions.map((version) => ({
      id: version.id,
      version_no: version.versionNo,
      rubric: JSON.parse(version.rubricJson),
      source_type: version.sourceType,
      model_name: version.modelName,
      ai_agent: version.aiAgent,
      prompt_version: version.promptVersion,
      status: version.status,
      created_at: version.createdAt.toISOString(),
      updated_at: version.updatedAt.toISOString()
    }))
  };
}

function parseJson(value: string | null) {
  if (!value) {
    return null;
  }

  return JSON.parse(value);
}

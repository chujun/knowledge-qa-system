import type { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  buildErrorSetItems,
  type ErrorAttemptEvidence
} from "@/lib/domain/error-set";
import {
  calculateKnowledgePointMastery,
  type CognitiveDimension,
  type MasteryEvidence
} from "@/lib/domain/mastery";
import { scoreAnswerAttempt } from "@/lib/ai/answer-scoring";
import { prisma } from "@/lib/db/prisma";
import { getDefaultUser } from "@/lib/knowledge/service";

export const submitAnswerAttemptSchema = z.object({
  user_answer: z.string().trim().min(1).max(8000),
  affects_mastery: z.boolean().default(true)
});

export const confirmScoreSchema = z.object({
  user_confirmed_score: z.number().int().min(0).max(100),
  score_diff_reason: z.string().trim().max(1000).optional()
});

export const createPracticeSessionSchema = z.object({
  session_type: z.enum(["knowledge_point", "topic", "domain", "error_set"]).default("knowledge_point"),
  target_type: z.enum(["knowledge_point", "topic", "domain"]),
  target_id: z.string().min(1),
  strategy: z
    .object({
      prefer_weak_dimensions: z.boolean().default(true),
      include_error_set: z.boolean().default(true),
      question_count: z.number().int().min(1).max(20).default(5),
      difficulty_min: z.number().int().min(1).max(5).optional(),
      difficulty_max: z.number().int().min(1).max(5).optional()
    })
    .default({})
});

export async function createPracticeSession(
  input: z.infer<typeof createPracticeSessionSchema>
) {
  const user = await getDefaultUser();
  const strategy = {
    prefer_weak_dimensions: input.strategy.prefer_weak_dimensions ?? true,
    include_error_set: input.strategy.include_error_set ?? true,
    question_count: input.strategy.question_count ?? 5,
    difficulty_min: input.strategy.difficulty_min,
    difficulty_max: input.strategy.difficulty_max
  };
  const candidates = await selectPracticeQuestions({
    userId: user.id,
    targetType: input.target_type,
    targetId: input.target_id,
    strategy
  });

  if (candidates.length === 0) {
    throw new Error("no_practice_questions_found");
  }

  const session = await prisma.practiceSession.create({
    data: {
      userId: user.id,
      sessionType: input.session_type,
      targetType: input.target_type,
      targetId: input.target_id,
      strategyJson: JSON.stringify(strategy),
      status: "created",
      items: {
        create: candidates.map((candidate, index) => ({
          questionId: candidate.question.id,
          orderNo: index + 1,
          selectionReason: candidate.reason,
          sourceType: "confirmed_question",
          status: "pending"
        }))
      }
    },
    include: practiceSessionInclude
  });

  return serializePracticeSession(session);
}

export async function getPracticeSession(practiceSessionId: string) {
  const user = await getDefaultUser();
  const session = await prisma.practiceSession.findFirst({
    where: {
      id: practiceSessionId,
      userId: user.id
    },
    include: practiceSessionInclude
  });

  return session ? enrichPracticeSessionWithAttempts(serializePracticeSession(session)) : null;
}

export async function listPracticeSessions(params: {
  status?: string | null;
  targetId?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await getDefaultUser();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where: Prisma.PracticeSessionWhereInput = {
    userId: user.id,
    ...(params.status ? { status: params.status } : {}),
    ...(params.targetId ? { targetId: params.targetId } : {})
  };

  const [items, total] = await Promise.all([
    prisma.practiceSession.findMany({
      where,
      include: practiceSessionInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.practiceSession.count({ where })
  ]);
  const targetNames = await resolvePracticeSessionTargetNames(user.id, items);

  return {
    items: items.map((item) => {
      const serialized = serializePracticeSession(item);
      return {
        ...serialized,
        target_name: targetNames.get(item.targetId) ?? null
      };
    }),
    page,
    pageSize,
    total
  };
}

export async function submitPracticeSessionItemAnswer(
  practiceSessionId: string,
  practiceSessionItemId: string,
  input: z.infer<typeof submitAnswerAttemptSchema>
) {
  const user = await getDefaultUser();
  const item = await prisma.practiceSessionItem.findFirst({
    where: {
      id: practiceSessionItemId,
      practiceSessionId,
      practiceSession: {
        userId: user.id
      }
    },
    include: {
      practiceSession: {
        include: {
          items: true
        }
      }
    }
  });

  if (!item) {
    throw new Error("practice_session_item_not_found");
  }

  const attempt = await submitAnswerAttempt(item.questionId, input);

  await prisma.practiceSessionItem.update({
    where: { id: item.id },
    data: { status: "answered" }
  });

  const allItemIds = item.practiceSession.items.map((sessionItem) => sessionItem.id);
  const answeredCount = await prisma.practiceSessionItem.count({
    where: {
      id: { in: allItemIds },
      OR: [{ status: "answered" }, { id: item.id }]
    }
  });

  await prisma.practiceSession.update({
    where: { id: practiceSessionId },
    data: {
      status:
        answeredCount >= item.practiceSession.items.length
          ? "completed"
          : "in_progress"
    }
  });

  return attempt;
}

export async function submitAnswerAttempt(
  questionId: string,
  input: z.infer<typeof submitAnswerAttemptSchema>
) {
  const user = await getDefaultUser();
  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      userId: user.id
    },
    include: {
      knowledgePoint: true,
      versions: {
        where: { status: "active" },
        orderBy: { versionNo: "desc" },
        take: 1
      },
      answerVersions: {
        where: { status: "active" },
        orderBy: { versionNo: "desc" },
        take: 1
      },
      rubricVersions: {
        where: { status: "active" },
        orderBy: { versionNo: "desc" },
        take: 1
      }
    }
  });

  if (!question || question.status !== "confirmed") {
    throw new Error("question_not_found");
  }

  const questionVersion = question.versions[0];
  const answerVersion = question.answerVersions[0];
  const rubricVersion = question.rubricVersions[0];

  if (!questionVersion || !answerVersion || !rubricVersion) {
    throw new Error("active_versions_not_found");
  }

  const score = await scoreAnswerAttempt({
    question: {
      knowledgePointName: question.knowledgePoint.name,
      stem: questionVersion.stem,
      cognitiveDimension: question.cognitiveDimension,
      difficultyLevel: question.difficultyLevel,
      questionType: question.questionType,
      expectedAnswer: answerVersion.answerText,
      explanationText: answerVersion.explanationText,
      rubric: parseJsonObject(rubricVersion.rubricJson),
      userAnswer: input.user_answer
    }
  });

  const attempt = await prisma.answerAttempt.create({
    data: {
      userId: user.id,
      questionId: question.id,
      questionVersionId: questionVersion.id,
      answerVersionId: answerVersion.id,
      scoringRubricVersionId: rubricVersion.id,
      userAnswer: input.user_answer,
      aiScore: score.score,
      aiFeedback: score.feedback,
      finalScore: score.score,
      reasonTagsJson: JSON.stringify(score.reasonTags),
      affectsMastery: input.affects_mastery,
      status: "ai_scored"
    },
    include: attemptInclude
  });

  await prisma.generationRecord.create({
    data: {
      userId: user.id,
      targetType: "answer_attempt",
      targetId: attempt.id,
      callType: "answer_scoring",
      modelName: score.metadata.modelName,
      modelVersion: score.metadata.modelVersion,
      aiAgent: score.metadata.aiAgent,
      promptVersion: score.metadata.promptVersion,
      inputTokens: score.metadata.inputTokens,
      outputTokens: score.metadata.outputTokens,
      latencyMs: score.metadata.latencyMs,
      status: "success"
    }
  });

  if (attempt.affectsMastery) {
    await recomputeKnowledgePointLearningState(question.knowledgePointId);
  }

  return serializeAttempt(attempt);
}

export async function confirmScore(
  attemptId: string,
  input: z.infer<typeof confirmScoreSchema>
) {
  const user = await getDefaultUser();
  const existing = await prisma.answerAttempt.findFirst({
    where: {
      id: attemptId,
      userId: user.id
    },
    include: {
      question: true
    }
  });

  if (!existing) {
    throw new Error("attempt_not_found");
  }

  const attempt = await prisma.answerAttempt.update({
    where: { id: existing.id },
    data: {
      userConfirmedScore: input.user_confirmed_score,
      scoreDiffReason: input.score_diff_reason,
      finalScore: input.user_confirmed_score,
      status: "user_confirmed"
    },
    include: attemptInclude
  });

  if (attempt.affectsMastery) {
    await recomputeKnowledgePointLearningState(existing.question.knowledgePointId);
  }

  return serializeAttempt(attempt);
}

export async function listAnswerAttempts(params: {
  questionId?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await getDefaultUser();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where: Prisma.AnswerAttemptWhereInput = {
    userId: user.id,
    ...(params.questionId ? { questionId: params.questionId } : {}),
    ...(params.status ? { status: params.status } : {})
  };

  const [items, total] = await Promise.all([
    prisma.answerAttempt.findMany({
      where,
      include: attemptInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.answerAttempt.count({ where })
  ]);

  return { items: items.map(serializeAttempt), page, pageSize, total };
}

export async function listMasteryProfiles(params: {
  targetType?: string | null;
  targetId?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await getDefaultUser();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where: Prisma.MasteryProfileWhereInput = {
    userId: user.id,
    ...(params.targetType ? { targetType: params.targetType } : {}),
    ...(params.targetId ? { targetId: params.targetId } : {})
  };

  const [items, total] = await Promise.all([
    prisma.masteryProfile.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.masteryProfile.count({ where })
  ]);
  const targetNames = await resolveMasteryTargetNames(user.id, items);

  return {
    items: items.map((item) =>
      serializeMasteryProfile({
        ...item,
        targetName: targetNames.get(`${item.targetType}:${item.targetId}`) ?? null
      })
    ),
    page,
    pageSize,
    total
  };
}

export async function listErrorSets(params: {
  knowledgePointId?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await getDefaultUser();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where: Prisma.ErrorSetWhereInput = {
    userId: user.id,
    ...(params.knowledgePointId
      ? { knowledgePointId: params.knowledgePointId }
      : {}),
    ...(params.status ? { status: params.status } : {})
  };

  const [items, total] = await Promise.all([
    prisma.errorSet.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.errorSet.count({ where })
  ]);
  const knowledgePointIds = [...new Set(items.map((item) => item.knowledgePointId))];
  const knowledgePoints =
    knowledgePointIds.length === 0
      ? []
      : await prisma.knowledgePoint.findMany({
          where: {
            id: { in: knowledgePointIds },
            userId: user.id
          },
          select: {
            id: true,
            name: true,
            status: true
          }
        });
  const knowledgePointById = new Map(
    knowledgePoints.map((point) => [point.id, point])
  );

  return {
    items: items.map((item) =>
      serializeErrorSet({
        ...item,
        knowledgePoint: knowledgePointById.get(item.knowledgePointId) ?? null
      })
    ),
    page,
    pageSize,
    total
  };
}

export async function resolveErrorSet(errorSetId: string) {
  const user = await getDefaultUser();
  const errorSet = await prisma.errorSet.update({
    where: {
      id: errorSetId,
      userId: user.id
    },
    data: {
      status: "resolved"
    }
  });

  return serializeErrorSet(errorSet);
}

const attemptInclude = {
  question: true,
  questionVersion: true,
  answerVersion: true,
  scoringRubricVersion: true
} satisfies Prisma.AnswerAttemptInclude;

const practiceSessionInclude = {
  items: {
    include: {
      question: {
        include: {
          versions: {
            where: { status: "active" },
            orderBy: { versionNo: "desc" },
            take: 1
          },
          answerVersions: {
            where: { status: "active" },
            orderBy: { versionNo: "desc" },
            take: 1
          },
          rubricVersions: {
            where: { status: "active" },
            orderBy: { versionNo: "desc" },
            take: 1
          }
        }
      }
    },
    orderBy: { orderNo: "asc" }
  }
} satisfies Prisma.PracticeSessionInclude;

type SerializedAttempt = ReturnType<typeof serializeAttempt>;

async function selectPracticeQuestions(params: {
  userId: string;
  targetType: "knowledge_point" | "topic" | "domain";
  targetId: string;
  strategy: {
    prefer_weak_dimensions: boolean;
    include_error_set: boolean;
    question_count: number;
    difficulty_min?: number;
    difficulty_max?: number;
  };
}) {
  const knowledgePointIds = await resolveKnowledgePointIds(
    params.userId,
    params.targetType,
    params.targetId
  );

  if (knowledgePointIds.length === 0) {
    return [];
  }

  const [profiles, errorSets, questions] = await Promise.all([
    prisma.masteryProfile.findMany({
      where: {
        userId: params.userId,
        targetType: "knowledge_point",
        targetId: { in: knowledgePointIds },
        status: "active"
      }
    }),
    prisma.errorSet.findMany({
      where: {
        userId: params.userId,
        knowledgePointId: { in: knowledgePointIds },
        status: "active"
      }
    }),
    prisma.question.findMany({
      where: {
        userId: params.userId,
        knowledgePointId: { in: knowledgePointIds },
        status: "confirmed",
        ...(params.strategy.difficulty_min
          ? { difficultyLevel: { gte: params.strategy.difficulty_min } }
          : {}),
        ...(params.strategy.difficulty_max
          ? { difficultyLevel: { lte: params.strategy.difficulty_max } }
          : {})
      },
      include: {
        versions: {
          where: { status: "active" },
          orderBy: { versionNo: "desc" },
          take: 1
        },
        answerVersions: {
          where: { status: "active" },
          orderBy: { versionNo: "desc" },
          take: 1
        },
        rubricVersions: {
          where: { status: "active" },
          orderBy: { versionNo: "desc" },
          take: 1
        }
      },
      orderBy: [{ difficultyLevel: "asc" }, { createdAt: "desc" }]
    })
  ]);

  const errorKnowledgePointIds = new Set(
    errorSets.map((item) => item.knowledgePointId)
  );
  const weakDimensionsByPoint = new Map(
    profiles.map((profile) => [
      profile.targetId,
      new Set(parseStringArray(profile.weakDimensionsJson))
    ])
  );

  const scored = questions
    .filter(
      (question) =>
        question.versions[0] &&
        question.answerVersions[0] &&
        question.rubricVersions[0]
    )
    .map((question) => {
      let priority = 0;
      const reasons = [];
      const weakDimensions =
        weakDimensionsByPoint.get(question.knowledgePointId) ?? new Set<string>();

      if (
        params.strategy.include_error_set &&
        errorKnowledgePointIds.has(question.knowledgePointId)
      ) {
        priority += 100;
        reasons.push("命中活跃错误集");
      }

      if (
        params.strategy.prefer_weak_dimensions &&
        weakDimensions.has(question.cognitiveDimension)
      ) {
        priority += 50;
        reasons.push(`优先练习薄弱维度：${question.cognitiveDimension}`);
      }

      if (reasons.length === 0) {
        reasons.push("补充正式题库覆盖");
      }

      return {
        question,
        priority,
        reason: reasons.join("；")
      };
    })
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        b.question.difficultyLevel - a.question.difficultyLevel ||
        b.question.createdAt.getTime() - a.question.createdAt.getTime()
    );

  return scored.slice(0, params.strategy.question_count);
}

async function resolveKnowledgePointIds(
  userId: string,
  targetType: "knowledge_point" | "topic" | "domain",
  targetId: string
) {
  if (targetType === "knowledge_point") {
    const point = await prisma.knowledgePoint.findFirst({
      where: { id: targetId, userId, status: "confirmed" }
    });
    return point ? [point.id] : [];
  }

  const points = await prisma.knowledgePoint.findMany({
    where: {
      userId,
      status: "confirmed",
      ...(targetType === "topic" ? { topicId: targetId } : {}),
      ...(targetType === "domain" ? { domainId: targetId } : {})
    },
    select: { id: true }
  });

  return points.map((point) => point.id);
}

async function recomputeKnowledgePointLearningState(knowledgePointId: string) {
  const user = await getDefaultUser();
  const attempts = await prisma.answerAttempt.findMany({
    where: {
      userId: user.id,
      affectsMastery: true,
      question: {
        knowledgePointId,
        status: "confirmed"
      }
    },
    include: {
      question: true
    },
    orderBy: { createdAt: "asc" }
  });

  const masteryEvidence: MasteryEvidence[] = attempts.map((attempt) => ({
    dimension: attempt.question.cognitiveDimension as CognitiveDimension,
    score: attempt.userConfirmedScore ?? attempt.aiScore,
    difficultyLevel: attempt.question.difficultyLevel
  }));
  const snapshot = calculateKnowledgePointMastery(
    knowledgePointId,
    masteryEvidence
  );
  const weakDimensions = Object.entries(snapshot.dimensionScores)
    .filter(([, score]) => score > 0 && score < 60)
    .map(([dimension]) => dimension);

  await prisma.masteryProfile.upsert({
    where: {
      userId_targetType_targetId: {
        userId: user.id,
        targetType: "knowledge_point",
        targetId: knowledgePointId
      }
    },
    update: {
      dimensionScoresJson: JSON.stringify(snapshot.dimensionScores),
      overallScore: snapshot.overallScore,
      evidenceCount: snapshot.evidenceCount,
      weakDimensionsJson: JSON.stringify(weakDimensions),
      status: "active"
    },
    create: {
      userId: user.id,
      targetType: "knowledge_point",
      targetId: knowledgePointId,
      dimensionScoresJson: JSON.stringify(snapshot.dimensionScores),
      overallScore: snapshot.overallScore,
      evidenceCount: snapshot.evidenceCount,
      weakDimensionsJson: JSON.stringify(weakDimensions),
      status: "active"
    }
  });

  const errorEvidence: ErrorAttemptEvidence[] = attempts.map((attempt) => ({
    answerAttemptId: attempt.id,
    questionId: attempt.questionId,
    knowledgePointId,
    cognitiveDimension: attempt.question.cognitiveDimension as CognitiveDimension,
    aiScore: attempt.aiScore,
    finalScore: attempt.userConfirmedScore ?? attempt.finalScore,
    reasonTags: parseStringArray(attempt.reasonTagsJson)
  }));
  const errorSet = buildErrorSetItems(errorEvidence)[0];

  if (!errorSet) {
    await prisma.errorSet.updateMany({
      where: {
        userId: user.id,
        knowledgePointId
      },
      data: {
        status: "resolved",
        attemptIdsJson: JSON.stringify([]),
        dominantTagsJson: JSON.stringify([])
      }
    });
    return;
  }

  await prisma.errorSet.upsert({
    where: {
      userId_knowledgePointId: {
        userId: user.id,
        knowledgePointId
      }
    },
    update: {
      attemptIdsJson: JSON.stringify(
        errorSet.attempts.map((attempt) => attempt.answerAttemptId)
      ),
      dominantTagsJson: JSON.stringify(errorSet.dominantReasonTags),
      status: "active"
    },
    create: {
      userId: user.id,
      knowledgePointId,
      attemptIdsJson: JSON.stringify(
        errorSet.attempts.map((attempt) => attempt.answerAttemptId)
      ),
      dominantTagsJson: JSON.stringify(errorSet.dominantReasonTags),
      status: "active"
    }
  });
}

function serializeAttempt(
  attempt: Prisma.AnswerAttemptGetPayload<{ include: typeof attemptInclude }>
) {
  return {
    id: attempt.id,
    question_id: attempt.questionId,
    question_version_id: attempt.questionVersionId,
    answer_version_id: attempt.answerVersionId,
    scoring_rubric_version_id: attempt.scoringRubricVersionId,
    user_answer: attempt.userAnswer,
    ai_score: attempt.aiScore,
    ai_feedback: attempt.aiFeedback,
    user_confirmed_score: attempt.userConfirmedScore,
    score_diff_reason: attempt.scoreDiffReason,
    final_score: attempt.finalScore,
    reason_tags: parseStringArray(attempt.reasonTagsJson),
    affects_mastery: attempt.affectsMastery,
    status: attempt.status,
    question: {
      id: attempt.question.id,
      cognitive_dimension: attempt.question.cognitiveDimension,
      difficulty_level: attempt.question.difficultyLevel
    },
    question_version: {
      stem: attempt.questionVersion.stem
    },
    answer_version: {
      answer: attempt.answerVersion.answerText,
      explanation: attempt.answerVersion.explanationText
    },
    created_at: attempt.createdAt.toISOString(),
    updated_at: attempt.updatedAt.toISOString()
  };
}

function serializeMasteryProfile(profile: {
  id: string;
  targetType: string;
  targetId: string;
  targetName?: string | null;
  dimensionScoresJson: string;
  overallScore: number;
  evidenceCount: number;
  weakDimensionsJson: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: profile.id,
    target_type: profile.targetType,
    target_id: profile.targetId,
    target_name: profile.targetName,
    dimension_scores: JSON.parse(profile.dimensionScoresJson),
    overall_score: profile.overallScore,
    evidence_count: profile.evidenceCount,
    weak_dimensions: parseStringArray(profile.weakDimensionsJson),
    status: profile.status,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString()
  };
}

async function resolveMasteryTargetNames(
  userId: string,
  profiles: Array<{ targetType: string; targetId: string }>
) {
  const result = new Map<string, string>();
  const idsByType = new Map<string, string[]>();

  for (const profile of profiles) {
    idsByType.set(profile.targetType, [
      ...(idsByType.get(profile.targetType) ?? []),
      profile.targetId
    ]);
  }

  const [points, topics, domains] = await Promise.all([
    resolveKnowledgePointNames(userId, idsByType.get("knowledge_point") ?? []),
    resolveTopicNames(userId, idsByType.get("topic") ?? []),
    resolveDomainNames(userId, idsByType.get("domain") ?? [])
  ]);

  for (const point of points) {
    result.set(`knowledge_point:${point.id}`, point.name);
  }

  for (const topic of topics) {
    result.set(`topic:${topic.id}`, topic.name);
  }

  for (const domain of domains) {
    result.set(`domain:${domain.id}`, domain.name);
  }

  return result;
}

async function resolveKnowledgePointNames(userId: string, ids: string[]) {
  return ids.length === 0
    ? []
    : prisma.knowledgePoint.findMany({
        where: { id: { in: [...new Set(ids)] }, userId },
        select: { id: true, name: true }
      });
}

async function resolveTopicNames(userId: string, ids: string[]) {
  return ids.length === 0
    ? []
    : prisma.knowledgeTopic.findMany({
        where: { id: { in: [...new Set(ids)] }, userId },
        select: { id: true, name: true }
      });
}

async function resolveDomainNames(userId: string, ids: string[]) {
  return ids.length === 0
    ? []
    : prisma.knowledgeDomain.findMany({
        where: { id: { in: [...new Set(ids)] }, userId },
        select: { id: true, name: true }
      });
}

function serializeErrorSet(errorSet: {
  id: string;
  knowledgePointId: string;
  knowledgePoint?: {
    id: string;
    name: string;
    status: string;
  } | null;
  attemptIdsJson: string;
  dominantTagsJson: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: errorSet.id,
    knowledge_point_id: errorSet.knowledgePointId,
    knowledge_point: errorSet.knowledgePoint
      ? {
          id: errorSet.knowledgePoint.id,
          name: errorSet.knowledgePoint.name,
          status: errorSet.knowledgePoint.status
        }
      : null,
    attempt_ids: parseStringArray(errorSet.attemptIdsJson),
    dominant_tags: parseStringArray(errorSet.dominantTagsJson),
    status: errorSet.status,
    created_at: errorSet.createdAt.toISOString(),
    updated_at: errorSet.updatedAt.toISOString()
  };
}

function serializePracticeSession(
  session: Prisma.PracticeSessionGetPayload<{
    include: typeof practiceSessionInclude;
  }>
) {
  const answeredCount = session.items.filter((item) => item.status === "answered").length;

  return {
    id: session.id,
    session_type: session.sessionType,
    target_type: session.targetType,
    target_id: session.targetId,
    strategy: JSON.parse(session.strategyJson),
    status: session.status,
    progress: {
      total: session.items.length,
      answered: answeredCount,
      pending: Math.max(0, session.items.length - answeredCount)
    },
    questions: session.items.map((item) => ({
      practice_session_item_id: item.id,
      order_no: item.orderNo,
      question_id: item.questionId,
      question_version_id: item.question.versions[0]?.id ?? null,
      answer_version_id: item.question.answerVersions[0]?.id ?? null,
      scoring_rubric_version_id: item.question.rubricVersions[0]?.id ?? null,
      stem: item.question.versions[0]?.stem ?? "",
      question_type: item.question.questionType,
      cognitive_dimension: item.question.cognitiveDimension,
      difficulty_level: item.question.difficultyLevel,
      selection_reason: item.selectionReason,
      source_type: item.sourceType,
      status: item.status,
      latest_attempt: null as SerializedAttempt | null
    })),
    created_at: session.createdAt.toISOString(),
    updated_at: session.updatedAt.toISOString()
  };
}

async function resolvePracticeSessionTargetNames(
  userId: string,
  sessions: Array<Prisma.PracticeSessionGetPayload<{ include: typeof practiceSessionInclude }>>
) {
  const knowledgePointIds = Array.from(
    new Set(
      sessions
        .filter((session) => session.targetType === "knowledge_point")
        .map((session) => session.targetId)
    )
  );
  const names = new Map<string, string>();

  if (knowledgePointIds.length === 0) {
    return names;
  }

  const points = await prisma.knowledgePoint.findMany({
    where: {
      userId,
      id: { in: knowledgePointIds }
    },
    select: {
      id: true,
      name: true
    }
  });

  for (const point of points) {
    names.set(point.id, point.name);
  }

  return names;
}

async function enrichPracticeSessionWithAttempts(
  session: ReturnType<typeof serializePracticeSession>
) {
  const user = await getDefaultUser();
  const questionIds = session.questions.map((question) => question.question_id);

  if (questionIds.length === 0) {
    return session;
  }

  const attempts = await prisma.answerAttempt.findMany({
    where: {
      userId: user.id,
      questionId: { in: questionIds }
    },
    include: attemptInclude,
    orderBy: { createdAt: "desc" }
  });
  const latestByQuestionId = new Map<string, SerializedAttempt>();

  for (const attempt of attempts) {
    if (!latestByQuestionId.has(attempt.questionId)) {
      latestByQuestionId.set(attempt.questionId, serializeAttempt(attempt));
    }
  }

  return {
    ...session,
    questions: session.questions.map((question) => ({
      ...question,
      latest_attempt: latestByQuestionId.get(question.question_id) ?? null
    }))
  };
}

function parseStringArray(value: string) {
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
}

function parseJsonObject(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

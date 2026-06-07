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

  const score = scoreMockAnswer({
    userAnswer: input.user_answer,
    expectedAnswer: answerVersion.answerText,
    dimension: question.cognitiveDimension
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

  return { items: items.map(serializeMasteryProfile), page, pageSize, total };
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

  return { items: items.map(serializeErrorSet), page, pageSize, total };
}

const attemptInclude = {
  question: true,
  questionVersion: true,
  answerVersion: true,
  scoringRubricVersion: true
} satisfies Prisma.AnswerAttemptInclude;

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

function scoreMockAnswer(input: {
  userAnswer: string;
  expectedAnswer: string;
  dimension: string;
}) {
  const answer = input.userAnswer.toLowerCase();
  const lengthScore = Math.min(45, Math.floor(input.userAnswer.length / 3));
  const keywordScore = ["概念", "应用", "步骤", "原因", "标准", "workflow", "触发"]
    .filter((keyword) => answer.includes(keyword.toLowerCase())).length * 8;
  const expectedKeywordScore = input.expectedAnswer
    .split(/\s+|，|。|、/)
    .filter((word) => word.length >= 2)
    .slice(0, 5)
    .filter((word) => answer.includes(word.toLowerCase())).length * 5;
  const rawScore = 25 + lengthScore + keywordScore + expectedKeywordScore;
  const score = Math.min(100, Math.max(0, rawScore));
  const reasonTags = buildReasonTags(score, input.dimension);

  return {
    score,
    feedback:
      score >= 80
        ? "回答覆盖了核心要点，可以继续挑战更高阶问题。"
        : "回答还需要补充关键概念、边界条件和可验证示例。",
    reasonTags
  };
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
    created_at: attempt.createdAt.toISOString(),
    updated_at: attempt.updatedAt.toISOString()
  };
}

function serializeMasteryProfile(profile: {
  id: string;
  targetType: string;
  targetId: string;
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
    dimension_scores: JSON.parse(profile.dimensionScoresJson),
    overall_score: profile.overallScore,
    evidence_count: profile.evidenceCount,
    weak_dimensions: parseStringArray(profile.weakDimensionsJson),
    status: profile.status,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString()
  };
}

function serializeErrorSet(errorSet: {
  id: string;
  knowledgePointId: string;
  attemptIdsJson: string;
  dominantTagsJson: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: errorSet.id,
    knowledge_point_id: errorSet.knowledgePointId,
    attempt_ids: parseStringArray(errorSet.attemptIdsJson),
    dominant_tags: parseStringArray(errorSet.dominantTagsJson),
    status: errorSet.status,
    created_at: errorSet.createdAt.toISOString(),
    updated_at: errorSet.updatedAt.toISOString()
  };
}

function parseStringArray(value: string) {
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
}

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { prisma as PrismaSingleton } from "@/lib/db/prisma";

type PrismaModule = {
  prisma: typeof PrismaSingleton;
};

describe("practice, scoring, mastery, and error set API routes", () => {
  let prisma: PrismaModule["prisma"];
  let dbPath: string;
  let domainsRoute: typeof import("./domains/route");
  let topicsRoute: typeof import("./topics/route");
  let knowledgeTypesRoute: typeof import("./knowledge-types/route");
  let knowledgePointsRoute: typeof import("./knowledge-points/route");
  let generationRoute: typeof import("./generation/knowledge-point/route");
  let confirmQuestionRoute: typeof import("./questions/[questionId]/confirm/route");
  let attemptsRoute: typeof import("./questions/[questionId]/attempts/route");
  let confirmScoreRoute: typeof import("./answer-attempts/[attemptId]/confirm-score/route");
  let masteryProfilesRoute: typeof import("./mastery-profiles/route");
  let errorSetsRoute: typeof import("./error-sets/route");
  let resolveErrorSetRoute: typeof import("./error-sets/[errorSetId]/resolve/route");
  let practiceSessionsRoute: typeof import("./practice-sessions/route");
  let practiceSessionRoute: typeof import("./practice-sessions/[practiceSessionId]/route");

  beforeAll(async () => {
    vi.resetModules();
    delete (globalThis as { prisma?: unknown }).prisma;

    const tmpDir = path.join(process.cwd(), "tmp", "vitest");
    mkdirSync(tmpDir, { recursive: true });

    dbPath = path.join(tmpDir, `practice-routes-${Date.now()}.db`);
    writeFileSync(dbPath, "");
    process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, "/")}`;
    process.env.KNOWLEDGE_QA_API_KEY = "test-api-key";

    const prismaModule = (await import("@/lib/db/prisma")) as PrismaModule;
    prisma = prismaModule.prisma;

    await applyMigration("20260607172000_add_core_knowledge_models");
    await applyMigration("20260607183000_add_ingestion_review_models");
    await applyMigration("20260607184500_add_question_generation_models");
    await applyMigration("20260607190000_add_attempt_mastery_models");
    await applyMigration("20260607191500_add_practice_session_models");

    domainsRoute = await import("./domains/route");
    topicsRoute = await import("./topics/route");
    knowledgeTypesRoute = await import("./knowledge-types/route");
    knowledgePointsRoute = await import("./knowledge-points/route");
    generationRoute = await import("./generation/knowledge-point/route");
    confirmQuestionRoute = await import("./questions/[questionId]/confirm/route");
    attemptsRoute = await import("./questions/[questionId]/attempts/route");
    confirmScoreRoute = await import(
      "./answer-attempts/[attemptId]/confirm-score/route"
    );
    masteryProfilesRoute = await import("./mastery-profiles/route");
    errorSetsRoute = await import("./error-sets/route");
    resolveErrorSetRoute = await import("./error-sets/[errorSetId]/resolve/route");
    practiceSessionsRoute = await import("./practice-sessions/route");
    practiceSessionRoute = await import("./practice-sessions/[practiceSessionId]/route");
  });

  afterAll(async () => {
    await prisma?.$disconnect();

    if (dbPath) {
      rmSync(dbPath, { force: true });
      rmSync(`${dbPath}-journal`, { force: true });
    }
  });

  it("submits answers, confirms score, and updates mastery plus error set", async () => {
    const fixture = await createConfirmedQuestionFixture();

    const attemptResponse = await attemptsRoute.POST(
      jsonRequest(
        `http://localhost/api/v1/questions/${fixture.question_id}/attempts`,
        {
          user_answer: "我只记得它和 workflow 触发有关，但步骤还不完整。"
        }
      ),
      {
        params: Promise.resolve({ questionId: fixture.question_id })
      }
    );
    const attemptBody = await attemptResponse.json();

    expect(attemptResponse.status).toBe(201);
    expect(attemptBody.data.status).toBe("ai_scored");
    expect(attemptBody.data.ai_score).toBeGreaterThanOrEqual(0);
    expect(attemptBody.data.affects_mastery).toBe(true);

    const masteryAfterAiScore = await masteryProfilesRoute.GET(
      authedRequest(
        `http://localhost/api/v1/mastery-profiles?target_type=knowledge_point&target_id=${fixture.knowledge_point_id}`
      )
    );
    const masteryAfterAiScoreBody = await masteryAfterAiScore.json();

    expect(masteryAfterAiScore.status).toBe(200);
    expect(masteryAfterAiScoreBody.data).toHaveLength(1);
    expect(masteryAfterAiScoreBody.data[0].evidence_count).toBe(1);

    const confirmResponse = await confirmScoreRoute.POST(
      jsonRequest(
        `http://localhost/api/v1/answer-attempts/${attemptBody.data.id}/confirm-score`,
        {
          user_confirmed_score: 45,
          score_diff_reason: "答案遗漏关键步骤，AI 分数偏高"
        }
      ),
      {
        params: Promise.resolve({ attemptId: attemptBody.data.id })
      }
    );
    const confirmBody = await confirmResponse.json();

    expect(confirmResponse.status).toBe(200);
    expect(confirmBody.data.status).toBe("user_confirmed");
    expect(confirmBody.data.final_score).toBe(45);
    expect(confirmBody.data.user_confirmed_score).toBe(45);

    const masteryResponse = await masteryProfilesRoute.GET(
      authedRequest(
        `http://localhost/api/v1/mastery-profiles?target_type=knowledge_point&target_id=${fixture.knowledge_point_id}`
      )
    );
    const masteryBody = await masteryResponse.json();

    expect(masteryResponse.status).toBe(200);
    expect(masteryBody.data[0].overall_score).toBeGreaterThan(0);
    expect(masteryBody.data[0].weak_dimensions).toContain(
      fixture.cognitive_dimension
    );

    const errorSetResponse = await errorSetsRoute.GET(
      authedRequest(
        `http://localhost/api/v1/error-sets?knowledge_point_id=${fixture.knowledge_point_id}&status=active`
      )
    );
    const errorSetBody = await errorSetResponse.json();

    expect(errorSetResponse.status).toBe(200);
    expect(errorSetBody.data).toHaveLength(1);
    expect(errorSetBody.data[0].attempt_ids).toContain(attemptBody.data.id);
    expect(errorSetBody.data[0].dominant_tags).toContain("missing_key_point");

    const resolveResponse = await resolveErrorSetRoute.POST(
      authedRequest(
        `http://localhost/api/v1/error-sets/${errorSetBody.data[0].id}/resolve`
      ),
      {
        params: Promise.resolve({ errorSetId: errorSetBody.data[0].id })
      }
    );
    const resolveBody = await resolveResponse.json();

    expect(resolveResponse.status).toBe(200);
    expect(resolveBody.data.status).toBe("resolved");
  });

  it("creates a targeted practice session from weak dimensions and error sets", async () => {
    const fixture = await createConfirmedQuestionFixture({
      cognitiveDimensions: ["apply", "understand"],
      questionCount: 2
    });

    const attemptResponse = await attemptsRoute.POST(
      jsonRequest(
        `http://localhost/api/v1/questions/${fixture.question_ids[0]}/attempts`,
        {
          user_answer: "workflow 触发，但我说不清实际步骤。"
        }
      ),
      {
        params: Promise.resolve({ questionId: fixture.question_ids[0] })
      }
    );
    const attemptBody = await attemptResponse.json();

    await confirmScoreRoute.POST(
      jsonRequest(
        `http://localhost/api/v1/answer-attempts/${attemptBody.data.id}/confirm-score`,
        {
          user_confirmed_score: 40,
          score_diff_reason: "应用步骤缺失"
        }
      ),
      {
        params: Promise.resolve({ attemptId: attemptBody.data.id })
      }
    );

    const sessionResponse = await practiceSessionsRoute.POST(
      jsonRequest("http://localhost/api/v1/practice-sessions", {
        session_type: "knowledge_point",
        target_type: "knowledge_point",
        target_id: fixture.knowledge_point_id,
        strategy: {
          prefer_weak_dimensions: true,
          include_error_set: true,
          question_count: 2
        }
      })
    );
    const sessionBody = await sessionResponse.json();

    expect(sessionResponse.status).toBe(201);
    expect(sessionBody.data.questions).toHaveLength(2);
    expect(sessionBody.data.questions[0].question_id).toBe(
      fixture.question_ids[0]
    );
    expect(sessionBody.data.questions[0].selection_reason).toContain(
      "命中活跃错误集"
    );
    expect(sessionBody.data.questions[0].selection_reason).toContain(
      "薄弱维度"
    );

    const detailResponse = await practiceSessionRoute.GET(
      authedRequest(
        `http://localhost/api/v1/practice-sessions/${sessionBody.data.id}`
      ),
      {
        params: Promise.resolve({ practiceSessionId: sessionBody.data.id })
      }
    );
    const detailBody = await detailResponse.json();

    expect(detailResponse.status).toBe(200);
    expect(detailBody.data.id).toBe(sessionBody.data.id);
    expect(detailBody.data.questions[0].stem).toContain("workflow");
  });

  async function createConfirmedQuestionFixture(options?: {
    cognitiveDimensions?: string[];
    questionCount?: number;
  }) {
    const unique = Date.now().toString();
    const domainResponse = await domainsRoute.POST(
      jsonRequest("http://localhost/api/v1/domains", {
        name: `计算机 ${unique}`
      })
    );
    const domainBody = await domainResponse.json();

    const topicResponse = await topicsRoute.POST(
      jsonRequest("http://localhost/api/v1/topics", {
        domain_id: domainBody.data.id,
        name: `GitHub Actions ${unique}`
      })
    );
    const topicBody = await topicResponse.json();

    const typesResponse = await knowledgeTypesRoute.GET(
      authedRequest("http://localhost/api/v1/knowledge-types")
    );
    const typesBody = await typesResponse.json();
    const conceptType = typesBody.data.find(
      (type: { code: string }) => type.code === "concept"
    );

    const pointResponse = await knowledgePointsRoute.POST(
      jsonRequest("http://localhost/api/v1/knowledge-points", {
        domain_id: domainBody.data.id,
        topic_id: topicBody.data.id,
        knowledge_type_id: conceptType.id,
        name: `workflow 触发条件 ${unique}`,
        complexity_level: "medium",
        suggested_difficulty: 3
      })
    );
    const pointBody = await pointResponse.json();

    const generationResponse = await generationRoute.POST(
      jsonRequest("http://localhost/api/v1/generation/knowledge-point", {
        knowledge_point_id: pointBody.data.id,
        cognitive_dimensions: options?.cognitiveDimensions ?? ["apply"],
        question_count: options?.questionCount ?? 1
      })
    );
    const generationBody = await generationResponse.json();
    const confirmedQuestions = [];

    for (const question of generationBody.data.questions) {
      const confirmQuestionResponse = await confirmQuestionRoute.POST(
        authedRequest(
          `http://localhost/api/v1/questions/${question.id}/confirm`
        ),
        {
          params: Promise.resolve({ questionId: question.id })
        }
      );
      confirmedQuestions.push((await confirmQuestionResponse.json()).data);
    }

    return {
      knowledge_point_id: pointBody.data.id,
      question_id: confirmedQuestions[0].id,
      question_ids: confirmedQuestions.map((question) => question.id),
      cognitive_dimension: confirmedQuestions[0].cognitive_dimension
    };
  }

  async function applyMigration(migrationName: string) {
    const migrationSql = readFileSync(
      path.join(process.cwd(), "prisma", "migrations", migrationName, "migration.sql"),
      "utf8"
    );

    for (const statement of splitSqlStatements(migrationSql)) {
      await prisma.$executeRawUnsafe(statement);
    }
  }
});

function authedRequest(url: string) {
  return new Request(url, {
    headers: {
      "x-api-key": "test-api-key"
    }
  });
}

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": "test-api-key"
    },
    body: JSON.stringify(body)
  });
}

function splitSqlStatements(sql: string) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

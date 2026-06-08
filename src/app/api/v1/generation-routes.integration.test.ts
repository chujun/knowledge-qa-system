import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { prisma as PrismaSingleton } from "@/lib/db/prisma";

type PrismaModule = {
  prisma: typeof PrismaSingleton;
};

describe("generation and question API routes", () => {
  let prisma: PrismaModule["prisma"];
  let dbPath: string;
  let domainsRoute: typeof import("./domains/route");
  let topicsRoute: typeof import("./topics/route");
  let knowledgeTypesRoute: typeof import("./knowledge-types/route");
  let knowledgePointsRoute: typeof import("./knowledge-points/route");
  let generationRoute: typeof import("./generation/knowledge-point/route");
  let questionsRoute: typeof import("./questions/route");
  let questionRoute: typeof import("./questions/[questionId]/route");
  let confirmQuestionRoute: typeof import("./questions/[questionId]/confirm/route");
  let archiveQuestionRoute: typeof import("./questions/[questionId]/archive/route");

  beforeAll(async () => {
    vi.resetModules();
    delete (globalThis as { prisma?: unknown }).prisma;

    const tmpDir = path.join(process.cwd(), "tmp", "vitest");
    mkdirSync(tmpDir, { recursive: true });

    dbPath = path.join(tmpDir, `generation-routes-${Date.now()}.db`);
    writeFileSync(dbPath, "");
    process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, "/")}`;
    process.env.KNOWLEDGE_QA_API_KEY = "test-api-key";

    const prismaModule = (await import("@/lib/db/prisma")) as PrismaModule;
    prisma = prismaModule.prisma;

    await applyMigration("20260607172000_add_core_knowledge_models");
    await applyMigration("20260607183000_add_ingestion_review_models");
    await applyMigration("20260607184500_add_question_generation_models");

    domainsRoute = await import("./domains/route");
    topicsRoute = await import("./topics/route");
    knowledgeTypesRoute = await import("./knowledge-types/route");
    knowledgePointsRoute = await import("./knowledge-points/route");
    generationRoute = await import("./generation/knowledge-point/route");
    questionsRoute = await import("./questions/route");
    questionRoute = await import("./questions/[questionId]/route");
    confirmQuestionRoute = await import("./questions/[questionId]/confirm/route");
    archiveQuestionRoute = await import("./questions/[questionId]/archive/route");
  });

  afterAll(async () => {
    await prisma?.$disconnect();

    if (dbPath) {
      rmSync(dbPath, { force: true });
      rmSync(`${dbPath}-journal`, { force: true });
    }
  });

  it("generates versioned questions, explanation, generation records, and quality checks", async () => {
    const knowledgePoint = await createKnowledgePointFixture();

    const generationResponse = await generationRoute.POST(
      jsonRequest("http://localhost/api/v1/generation/knowledge-point", {
        knowledge_point_id: knowledgePoint.id,
        cognitive_dimensions: ["understand", "apply", "analyze"],
        question_count: 3
      })
    );
    const generationBody = await generationResponse.json();

    expect(generationResponse.status).toBe(201);
    expect(generationBody.data.status).toBe("pending_confirmation");
    expect(generationBody.data.core_explanation.version.status).toBe("draft");
    expect(generationBody.data.questions).toHaveLength(3);
    expect(generationBody.data.questions[0].quality_check.status).toBe("passed");

    const generationRecordCount = await prisma.generationRecord.count({
      where: {
        userId: (await prisma.user.findFirstOrThrow()).id
      }
    });
    const qualityCheckCount = await prisma.qualityCheckRecord.count();

    expect(generationRecordCount).toBe(10);
    expect(qualityCheckCount).toBe(3);

    const questionsResponse = await questionsRoute.GET(
      authedRequest(
        `http://localhost/api/v1/questions?knowledge_point_id=${knowledgePoint.id}&status=pending_confirmation`
      )
    );
    const questionsBody = await questionsResponse.json();

    expect(questionsResponse.status).toBe(200);
    expect(questionsBody.data).toHaveLength(3);
    expect(questionsBody.data[0].answer_version.status).toBe("draft");

    const questionId = questionsBody.data[0].id;
    const confirmResponse = await confirmQuestionRoute.POST(
      authedRequest(`http://localhost/api/v1/questions/${questionId}/confirm`),
      {
        params: Promise.resolve({ questionId })
      }
    );
    const confirmBody = await confirmResponse.json();

    expect(confirmResponse.status).toBe(200);
    expect(confirmBody.data.status).toBe("confirmed");
    expect(confirmBody.data.question_version.status).toBe("active");
    expect(confirmBody.data.answer_version.status).toBe("active");
    expect(confirmBody.data.scoring_rubric_version.status).toBe("active");

    const detailResponse = await questionRoute.GET(
      authedRequest(`http://localhost/api/v1/questions/${questionId}`),
      {
        params: Promise.resolve({ questionId })
      }
    );
    const detailBody = await detailResponse.json();

    expect(detailResponse.status).toBe(200);
    expect(detailBody.data.question_versions).toHaveLength(1);
    expect(detailBody.data.answer_versions).toHaveLength(1);
    expect(detailBody.data.scoring_rubric_versions).toHaveLength(1);

    const archiveResponse = await archiveQuestionRoute.POST(
      authedRequest(`http://localhost/api/v1/questions/${questionId}/archive`),
      {
        params: Promise.resolve({ questionId })
      }
    );
    const archiveBody = await archiveResponse.json();

    expect(archiveResponse.status).toBe(200);
    expect(archiveBody.data.status).toBe("archived");
    expect(archiveBody.data.question_versions[0].status).toBe("archived");
    expect(archiveBody.data.answer_versions[0].status).toBe("archived");
    expect(archiveBody.data.scoring_rubric_versions[0].status).toBe("archived");
  });

  async function createKnowledgePointFixture() {
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

    return pointBody.data;
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

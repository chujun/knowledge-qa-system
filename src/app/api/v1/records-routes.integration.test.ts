import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { prisma as PrismaSingleton } from "@/lib/db/prisma";

type PrismaModule = {
  prisma: typeof PrismaSingleton;
};

describe("record query API routes", () => {
  let prisma: PrismaModule["prisma"];
  let dbPath: string;
  let domainsRoute: typeof import("./domains/route");
  let topicsRoute: typeof import("./topics/route");
  let knowledgeTypesRoute: typeof import("./knowledge-types/route");
  let knowledgePointsRoute: typeof import("./knowledge-points/route");
  let generationRoute: typeof import("./generation/knowledge-point/route");
  let externalConversationRoute: typeof import("./ingestions/external-conversation/route");
  let sourceReferencesRoute: typeof import("./source-references/route");
  let generationRecordsRoute: typeof import("./generation-records/route");
  let qualityChecksRoute: typeof import("./quality-checks/route");

  beforeAll(async () => {
    vi.resetModules();
    delete (globalThis as { prisma?: unknown }).prisma;

    const tmpDir = path.join(process.cwd(), "tmp", "vitest");
    mkdirSync(tmpDir, { recursive: true });

    dbPath = path.join(tmpDir, `records-routes-${Date.now()}.db`);
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
    externalConversationRoute = await import(
      "./ingestions/external-conversation/route"
    );
    sourceReferencesRoute = await import("./source-references/route");
    generationRecordsRoute = await import("./generation-records/route");
    qualityChecksRoute = await import("./quality-checks/route");
  });

  afterAll(async () => {
    await prisma?.$disconnect();

    if (dbPath) {
      rmSync(dbPath, { force: true });
      rmSync(`${dbPath}-journal`, { force: true });
    }
  });

  it("lists source references, generation records, and quality checks", async () => {
    await externalConversationRoute.POST(
      jsonRequest("http://localhost/api/v1/ingestions/external-conversation", {
        source_system: "Codex",
        conversation_id: "records-test-conversation",
        context_type: "summary",
        conversation_summary: "讨论了 GitHub Actions workflow 触发条件。",
        instruction: "沉淀为知识问答"
      })
    );
    const point = await createKnowledgePointFixture();

    const generationResponse = await generationRoute.POST(
      jsonRequest("http://localhost/api/v1/generation/knowledge-point", {
        knowledge_point_id: point.id,
        cognitive_dimensions: ["understand", "apply"],
        question_count: 2
      })
    );
    const generationBody = await generationResponse.json();

    const sourceResponse = await sourceReferencesRoute.GET(
      authedRequest(
        "http://localhost/api/v1/source-references?source_type=external_conversation&source_system=Codex"
      )
    );
    const sourceBody = await sourceResponse.json();

    expect(sourceResponse.status).toBe(200);
    expect(sourceBody.data).toHaveLength(1);
    expect(sourceBody.data[0]).toMatchObject({
      source_type: "external_conversation",
      source_system: "Codex",
      conversation_id: "records-test-conversation"
    });
    expect(sourceBody.data[0].source_content_length).toBe(0);

    const generationRecordsResponse = await generationRecordsRoute.GET(
      authedRequest(
        `http://localhost/api/v1/generation-records?target_type=question_version&call_type=question_generation`
      )
    );
    const generationRecordsBody = await generationRecordsResponse.json();

    expect(generationRecordsResponse.status).toBe(200);
    expect(generationRecordsBody.data).toHaveLength(2);
    expect(generationRecordsBody.data[0]).toMatchObject({
      model_name: "mock-minimax-m2.7-highspeed",
      ai_agent: "Codex",
      call_type: "question_generation",
      status: "success"
    });

    const questionId = generationBody.data.questions[0].id;
    const qualityChecksResponse = await qualityChecksRoute.GET(
      authedRequest(
        `http://localhost/api/v1/quality-checks?target_type=question&target_id=${questionId}&status=passed`
      )
    );
    const qualityChecksBody = await qualityChecksResponse.json();

    expect(qualityChecksResponse.status).toBe(200);
    expect(qualityChecksBody.data).toHaveLength(1);
    expect(qualityChecksBody.data[0].rule_result.has_stem).toBe(true);
    expect(qualityChecksBody.data[0].ai_result.passed).toBe(true);
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

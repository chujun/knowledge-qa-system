import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { prisma as PrismaSingleton } from "@/lib/db/prisma";

type PrismaModule = {
  prisma: typeof PrismaSingleton;
};

describe("core knowledge API routes", () => {
  let prisma: PrismaModule["prisma"];
  let dbPath: string;
  let domainsRoute: typeof import("./domains/route");
  let topicsRoute: typeof import("./topics/route");
  let knowledgeTypesRoute: typeof import("./knowledge-types/route");
  let knowledgePointsRoute: typeof import("./knowledge-points/route");

  beforeAll(async () => {
    vi.resetModules();
    delete (globalThis as { prisma?: unknown }).prisma;

    const tmpDir = path.join(process.cwd(), "tmp", "vitest");
    mkdirSync(tmpDir, { recursive: true });

    dbPath = path.join(tmpDir, `core-routes-${Date.now()}.db`);
    writeFileSync(dbPath, "");
    process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, "/")}`;
    process.env.KNOWLEDGE_QA_API_KEY = "test-api-key";

    const prismaModule = (await import("@/lib/db/prisma")) as PrismaModule;
    prisma = prismaModule.prisma;

    const migrationSql = readFileSync(
      path.join(
        process.cwd(),
        "prisma",
        "migrations",
        "20260607172000_add_core_knowledge_models",
        "migration.sql"
      ),
      "utf8"
    );

    for (const statement of splitSqlStatements(migrationSql)) {
      await prisma.$executeRawUnsafe(statement);
    }

    domainsRoute = await import("./domains/route");
    topicsRoute = await import("./topics/route");
    knowledgeTypesRoute = await import("./knowledge-types/route");
    knowledgePointsRoute = await import("./knowledge-points/route");
  });

  afterAll(async () => {
    await prisma?.$disconnect();

    if (dbPath) {
      rmSync(dbPath, { force: true });
      rmSync(`${dbPath}-journal`, { force: true });
    }
  });

  it("requires API key for protected routes", async () => {
    const response = await domainsRoute.GET(
      new Request("http://localhost/api/v1/domains")
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("creates and reads the core knowledge structure through route handlers", async () => {
    const unique = Date.now().toString();

    const domainResponse = await domainsRoute.POST(
      jsonRequest("http://localhost/api/v1/domains", {
        name: `计算机 ${unique}`,
        description: "路由级冒烟测试"
      })
    );
    const domainBody = await domainResponse.json();
    const domain = domainBody.data;

    expect(domainResponse.status).toBe(201);
    expect(domain.name).toBe(`计算机 ${unique}`);

    const typesResponse = await knowledgeTypesRoute.GET(
      authedRequest("http://localhost/api/v1/knowledge-types")
    );
    const typesBody = await typesResponse.json();
    const conceptType = typesBody.data.find(
      (type: { code: string }) => type.code === "concept"
    );

    expect(typesResponse.status).toBe(200);
    expect(conceptType).toBeDefined();

    const topicResponse = await topicsRoute.POST(
      jsonRequest("http://localhost/api/v1/topics", {
        domain_id: domain.id,
        name: `GitHub Actions ${unique}`,
        description: "路由级主题测试"
      })
    );
    const topicBody = await topicResponse.json();
    const topic = topicBody.data;

    expect(topicResponse.status).toBe(201);
    expect(topic.domain_id).toBe(domain.id);

    const pointResponse = await knowledgePointsRoute.POST(
      jsonRequest("http://localhost/api/v1/knowledge-points", {
        domain_id: domain.id,
        topic_id: topic.id,
        knowledge_type_id: conceptType.id,
        name: `workflow 触发条件 ${unique}`,
        complexity_level: "medium",
        suggested_difficulty: 3
      })
    );
    const pointBody = await pointResponse.json();

    expect(pointResponse.status).toBe(201);
    expect(pointBody.data).toMatchObject({
      domain_id: domain.id,
      topic_id: topic.id,
      knowledge_type_id: conceptType.id,
      status: "confirmed"
    });

    const listResponse = await knowledgePointsRoute.GET(
      authedRequest(
        `http://localhost/api/v1/knowledge-points?topic_id=${topic.id}&status=confirmed`
      )
    );
    const listBody = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0].id).toBe(pointBody.data.id);
  });
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

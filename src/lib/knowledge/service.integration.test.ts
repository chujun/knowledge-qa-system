import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { prisma as PrismaSingleton } from "@/lib/db/prisma";

type PrismaModule = {
  prisma: typeof PrismaSingleton;
};

type KnowledgeServiceModule = typeof import("./service");

describe("knowledge service database integration", () => {
  let prisma: PrismaModule["prisma"];
  let service: KnowledgeServiceModule;
  let dbPath: string;

  beforeAll(async () => {
    vi.resetModules();
    delete (globalThis as { prisma?: unknown }).prisma;

    const tmpDir = path.join(process.cwd(), "tmp", "vitest");
    mkdirSync(tmpDir, { recursive: true });

    dbPath = path.join(tmpDir, `knowledge-service-${Date.now()}.db`);
    writeFileSync(dbPath, "");
    process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, "/")}`;

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

    service = await import("./service");
  });

  afterAll(async () => {
    await prisma?.$disconnect();

    if (dbPath) {
      rmSync(dbPath, { force: true });
      rmSync(`${dbPath}-journal`, { force: true });
    }
  });

  it("creates and reads the core knowledge structure", async () => {
    const types = await service.listKnowledgeTypes();
    const conceptType = types.find((type) => type.code === "concept");

    expect(conceptType).toBeDefined();

    const unique = Date.now().toString();
    const domain = await service.createDomain({
      name: `AI 集成测试 ${unique}`,
      description: "用于验证领域、主题、知识点真实写入 SQLite",
      trust_policy: {
        official_doc: "high"
      }
    });

    const topic = await service.createTopic({
      domain_id: domain.id,
      name: `GitHub Actions ${unique}`,
      description: "验证主题创建",
      outline: ["workflow", "jobs", "steps"],
      suggested_level: "入门"
    });

    const point = await service.createKnowledgePoint({
      domain_id: domain.id,
      topic_id: topic.id,
      knowledge_type_id: conceptType!.id,
      name: `workflow 触发条件 ${unique}`,
      description: "验证知识点创建",
      complexity_level: "medium",
      suggested_difficulty: 3
    });

    const listedDomains = await service.listDomains({ status: "active" });
    const listedTopics = await service.listTopics({
      domainId: domain.id,
      status: "confirmed"
    });
    const listedPoints = await service.listKnowledgePoints({
      topicId: topic.id,
      status: "confirmed"
    });

    expect(listedDomains.items.some((item) => item.id === domain.id)).toBe(true);
    expect(listedTopics.items).toHaveLength(1);
    expect(listedTopics.items[0].id).toBe(topic.id);
    expect(listedPoints.items).toHaveLength(1);
    expect(listedPoints.items[0]).toMatchObject({
      id: point.id,
      domain_id: domain.id,
      topic_id: topic.id,
      knowledge_type_id: conceptType!.id,
      complexity_level: "medium",
      suggested_difficulty: 3
    });
  });

  it("reuses existing structure records when names are submitted twice", async () => {
    const types = await service.listKnowledgeTypes();
    const conceptType = types.find((type) => type.code === "concept");
    const unique = Date.now().toString();

    const domain = await service.createDomain({
      name: `重复领域 ${unique}`,
      description: "第一次创建"
    });
    const sameDomain = await service.createDomain({
      name: `重复领域 ${unique}`,
      description: "第二次提交"
    });

    const topic = await service.createTopic({
      domain_id: domain.id,
      name: `重复主题 ${unique}`,
      description: "第一次创建"
    });
    const sameTopic = await service.createTopic({
      domain_id: domain.id,
      name: `重复主题 ${unique}`,
      description: "第二次提交"
    });

    const point = await service.createKnowledgePoint({
      domain_id: domain.id,
      topic_id: topic.id,
      knowledge_type_id: conceptType!.id,
      name: `重复知识点 ${unique}`,
      description: "第一次创建",
      complexity_level: "medium",
      suggested_difficulty: 3
    });
    const samePoint = await service.createKnowledgePoint({
      domain_id: domain.id,
      topic_id: topic.id,
      knowledge_type_id: conceptType!.id,
      name: `重复知识点 ${unique}`,
      description: "第二次提交",
      complexity_level: "complex",
      suggested_difficulty: 4
    });

    expect(sameDomain.id).toBe(domain.id);
    expect(sameDomain.description).toBe("第二次提交");
    expect(sameTopic.id).toBe(topic.id);
    expect(sameTopic.description).toBe("第二次提交");
    expect(samePoint.id).toBe(point.id);
    expect(samePoint).toMatchObject({
      description: "第二次提交",
      complexity_level: "complex",
      suggested_difficulty: 4
    });
  });
});

function splitSqlStatements(sql: string) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

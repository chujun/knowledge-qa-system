import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { prisma as PrismaSingleton } from "@/lib/db/prisma";

type PrismaModule = {
  prisma: typeof PrismaSingleton;
};

describe("ingestion and review API routes", () => {
  let prisma: PrismaModule["prisma"];
  let dbPath: string;
  let externalConversationRoute: typeof import("./ingestions/external-conversation/route");
  let ingestionTaskRoute: typeof import("./ingestions/[ingestionTaskId]/route");
  let reviewItemsRoute: typeof import("./review-items/route");
  let reviewItemRoute: typeof import("./review-items/[reviewItemId]/route");
  let confirmReviewItemRoute: typeof import("./review-items/[reviewItemId]/confirm/route");
  let rejectReviewItemRoute: typeof import("./review-items/[reviewItemId]/reject/route");

  beforeAll(async () => {
    vi.resetModules();
    delete (globalThis as { prisma?: unknown }).prisma;

    const tmpDir = path.join(process.cwd(), "tmp", "vitest");
    mkdirSync(tmpDir, { recursive: true });

    dbPath = path.join(tmpDir, `ingestion-routes-${Date.now()}.db`);
    writeFileSync(dbPath, "");
    process.env.DATABASE_URL = `file:${dbPath.replace(/\\/g, "/")}`;
    process.env.KNOWLEDGE_QA_API_KEY = "test-api-key";

    const prismaModule = (await import("@/lib/db/prisma")) as PrismaModule;
    prisma = prismaModule.prisma;

    await applyMigration("20260607172000_add_core_knowledge_models");
    await applyMigration("20260607183000_add_ingestion_review_models");

    externalConversationRoute = await import(
      "./ingestions/external-conversation/route"
    );
    ingestionTaskRoute = await import("./ingestions/[ingestionTaskId]/route");
    reviewItemsRoute = await import("./review-items/route");
    reviewItemRoute = await import("./review-items/[reviewItemId]/route");
    confirmReviewItemRoute = await import(
      "./review-items/[reviewItemId]/confirm/route"
    );
    rejectReviewItemRoute = await import(
      "./review-items/[reviewItemId]/reject/route"
    );
  });

  afterAll(async () => {
    await prisma?.$disconnect();

    if (dbPath) {
      rmSync(dbPath, { force: true });
      rmSync(`${dbPath}-journal`, { force: true });
    }
  });

  it("creates a pending review item from an external AI Agent conversation", async () => {
    const response = await externalConversationRoute.POST(
      jsonRequest("http://localhost/api/v1/ingestions/external-conversation", {
        source_system: "Codex",
        conversation_id: "codex-session-1",
        context_type: "summary",
        conversation_summary:
          "用户正在学习 GitHub Actions，希望了解 workflow、触发条件、jobs 与 steps。",
        instruction: "围绕 GitHub Actions 准备理解型和应用型问答",
        target_domain_hint: "计算机"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.status).toBe("pending_review");
    expect(body.data.topic_suggestion.topic_name).toBe("GitHub Actions");
    expect(body.data.questions_preview).toHaveLength(2);
    expect(body.data.review_item_id).toBeTruthy();
    expect(body.data.review_url).toContain("review");

    const taskResponse = await ingestionTaskRoute.GET(
      authedRequest(
        `http://localhost/api/v1/ingestions/${body.data.ingestion_task_id}`
      ),
      {
        params: Promise.resolve({
          ingestionTaskId: body.data.ingestion_task_id
        })
      }
    );
    const taskBody = await taskResponse.json();

    expect(taskResponse.status).toBe(200);
    expect(taskBody.data.ingestion_task_id).toBe(body.data.ingestion_task_id);

    const reviewListResponse = await reviewItemsRoute.GET(
      authedRequest("http://localhost/api/v1/review-items?status=pending")
    );
    const reviewListBody = await reviewListResponse.json();

    expect(reviewListResponse.status).toBe(200);
    expect(reviewListBody.data).toHaveLength(1);
    expect(reviewListBody.data[0].review_item_id).toBe(body.data.review_item_id);

    const reviewItemResponse = await reviewItemRoute.GET(
      authedRequest(
        `http://localhost/api/v1/review-items/${body.data.review_item_id}`
      ),
      {
        params: Promise.resolve({
          reviewItemId: body.data.review_item_id
        })
      }
    );
    const reviewItemBody = await reviewItemResponse.json();

    expect(reviewItemResponse.status).toBe(200);
    expect(reviewItemBody.data.preview.topic_suggestion.topic_name).toBe(
      "GitHub Actions"
    );
  });

  it("returns the same ingestion task for repeated submissions", async () => {
    const payload = {
      source_system: "Codex",
      conversation_id: "codex-session-idempotent",
      context_type: "summary",
      conversation_summary: "GitHub Actions 重复沉淀测试",
      instruction: "为 GitHub Actions 生成问答",
      idempotency_key: "manual-idempotency-key"
    };

    const first = await externalConversationRoute.POST(
      jsonRequest("http://localhost/api/v1/ingestions/external-conversation", payload)
    );
    const second = await externalConversationRoute.POST(
      jsonRequest("http://localhost/api/v1/ingestions/external-conversation", payload)
    );
    const firstBody = await first.json();
    const secondBody = await second.json();

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(secondBody.data.ingestion_task_id).toBe(
      firstBody.data.ingestion_task_id
    );
  });

  it("confirms and rejects review items", async () => {
    const confirmSeed = await externalConversationRoute.POST(
      jsonRequest("http://localhost/api/v1/ingestions/external-conversation", {
        source_system: "Codex",
        context_type: "selected_excerpt",
        conversation_content: "GitHub Actions 可以通过 push 触发 workflow。",
        instruction: "生成 GitHub Actions 触发条件题目"
      })
    );
    const confirmSeedBody = await confirmSeed.json();

    const confirmResponse = await confirmReviewItemRoute.POST(
      jsonRequest(
        `http://localhost/api/v1/review-items/${confirmSeedBody.data.review_item_id}/confirm`,
        {
          edits: {
            topic_name: "GitHub Actions 触发条件"
          },
          include_existing_attempts_in_mastery: false
        }
      ),
      {
        params: Promise.resolve({
          reviewItemId: confirmSeedBody.data.review_item_id
        })
      }
    );
    const confirmBody = await confirmResponse.json();

    expect(confirmResponse.status).toBe(200);
    expect(confirmBody.data.status).toBe("confirmed");
    expect(confirmBody.data.preview.edits.topic_name).toBe(
      "GitHub Actions 触发条件"
    );

    const confirmedTask = await prisma.ingestionTask.findUniqueOrThrow({
      where: { id: confirmSeedBody.data.ingestion_task_id }
    });
    expect(confirmedTask.status).toBe("confirmed");

    const rejectSeed = await externalConversationRoute.POST(
      jsonRequest("http://localhost/api/v1/ingestions/external-conversation", {
        source_system: "Codex",
        context_type: "summary",
        conversation_summary: "一个暂时不需要入库的知识点",
        instruction: "生成临时问答"
      })
    );
    const rejectSeedBody = await rejectSeed.json();

    const rejectResponse = await rejectReviewItemRoute.POST(
      authedRequest(
        `http://localhost/api/v1/review-items/${rejectSeedBody.data.review_item_id}/reject`
      ),
      {
        params: Promise.resolve({
          reviewItemId: rejectSeedBody.data.review_item_id
        })
      }
    );
    const rejectBody = await rejectResponse.json();

    expect(rejectResponse.status).toBe(200);
    expect(rejectBody.data.status).toBe("rejected");
  });

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

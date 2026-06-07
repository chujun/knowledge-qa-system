import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { buildExternalConversationIdempotencyKey } from "@/lib/domain/ingestion";
import { prisma } from "@/lib/db/prisma";
import { getDefaultUser } from "@/lib/knowledge/service";

export const createExternalConversationIngestionSchema = z
  .object({
    source_system: z.string().trim().min(1).max(80),
    conversation_id: z.string().trim().max(160).optional(),
    context_type: z.enum([
      "full_conversation",
      "recent_turns",
      "selected_excerpt",
      "summary"
    ]),
    conversation_content: z.string().trim().max(20000).optional(),
    conversation_summary: z.string().trim().max(4000).optional(),
    instruction: z.string().trim().min(1).max(4000),
    target_topic_id: z.string().trim().optional().nullable(),
    target_domain_hint: z.string().trim().max(160).optional(),
    direct_confirm: z.boolean().default(false),
    idempotency_key: z.string().trim().max(200).optional()
  })
  .refine(
    (value) => Boolean(value.conversation_content || value.conversation_summary),
    {
      message: "conversation_content_or_summary_required",
      path: ["conversation_content"]
    }
  );

export const confirmReviewItemSchema = z.object({
  edits: z.record(z.string(), z.unknown()).optional(),
  include_existing_attempts_in_mastery: z.boolean().default(false)
});

export type CreateExternalConversationIngestionInput = z.infer<
  typeof createExternalConversationIngestionSchema
>;

export async function createExternalConversationIngestion(
  input: CreateExternalConversationIngestionInput
) {
  const user = await getDefaultUser();
  const idempotencyKey = buildExternalConversationIdempotencyKey({
    sourceSystem: input.source_system,
    conversationId: input.conversation_id,
    instruction: input.instruction,
    idempotencyKey: input.idempotency_key
  });

  const existing = await prisma.ingestionTask.findUnique({
    where: {
      userId_idempotencyKey: {
        userId: user.id,
        idempotencyKey
      }
    },
    include: {
      reviewItems: true
    }
  });

  if (existing) {
    return serializeIngestionTaskWithPreview(existing);
  }

  const preview = buildExternalConversationPreview(input);

  const created = await prisma.$transaction(async (tx) => {
    const source = await tx.sourceReference.create({
      data: {
        userId: user.id,
        sourceType: "external_conversation",
        sourceSystem: input.source_system,
        sourceContent: input.conversation_content,
        sourceSummary: input.conversation_summary,
        conversationId: input.conversation_id,
        trustLevel: "medium"
      }
    });

    const task = await tx.ingestionTask.create({
      data: {
        userId: user.id,
        ingestionType: "external_conversation",
        sourceReferenceId: source.id,
        requestedBy: "ai_agent",
        instruction: input.instruction,
        status: input.direct_confirm ? "confirmed" : "pending_review",
        idempotencyKey,
        resultPreviewJson: JSON.stringify(preview)
      }
    });

    await tx.reviewItem.create({
      data: {
        userId: user.id,
        ingestionTaskId: task.id,
        targetType: "ingestion_task",
        targetId: task.id,
        previewJson: JSON.stringify(preview),
        status: input.direct_confirm ? "confirmed" : "pending"
      }
    });

    return tx.ingestionTask.findUniqueOrThrow({
      where: { id: task.id },
      include: {
        reviewItems: true
      }
    });
  });

  return serializeIngestionTaskWithPreview(created);
}

export async function getIngestionTask(ingestionTaskId: string) {
  const user = await getDefaultUser();
  const task = await prisma.ingestionTask.findFirst({
    where: {
      id: ingestionTaskId,
      userId: user.id
    },
    include: {
      reviewItems: true,
      sourceReference: true
    }
  });

  return task ? serializeIngestionTaskWithPreview(task) : null;
}

export async function listReviewItems(params: {
  status?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await getDefaultUser();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where: Prisma.ReviewItemWhereInput = {
    userId: user.id,
    ...(params.status ? { status: params.status } : {})
  };

  const [items, total] = await Promise.all([
    prisma.reviewItem.findMany({
      where,
      include: {
        ingestionTask: true
      },
      orderBy: {
        createdAt: "desc"
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.reviewItem.count({ where })
  ]);

  return {
    items: items.map(serializeReviewItem),
    page,
    pageSize,
    total
  };
}

export async function getReviewItem(reviewItemId: string) {
  const user = await getDefaultUser();
  const item = await prisma.reviewItem.findFirst({
    where: {
      id: reviewItemId,
      userId: user.id
    },
    include: {
      ingestionTask: true
    }
  });

  return item ? serializeReviewItem(item) : null;
}

export async function confirmReviewItem(
  reviewItemId: string,
  input: z.infer<typeof confirmReviewItemSchema>
) {
  const user = await getDefaultUser();
  const now = new Date();

  const item = await prisma.$transaction(async (tx) => {
    const existing = await tx.reviewItem.findFirstOrThrow({
      where: {
        id: reviewItemId,
        userId: user.id
      }
    });

    const updated = await tx.reviewItem.update({
      where: {
        id: reviewItemId,
        userId: user.id
      },
      data: {
        status: "confirmed",
        confirmedAt: now,
        previewJson:
          input.edits === undefined
            ? undefined
            : JSON.stringify({
                ...parseJsonObject(existing.previewJson),
                edits: input.edits,
                include_existing_attempts_in_mastery:
                  input.include_existing_attempts_in_mastery
              })
      },
      include: {
        ingestionTask: true
      }
    });

    if (updated.ingestionTaskId) {
      await tx.ingestionTask.update({
        where: { id: updated.ingestionTaskId },
        data: { status: "confirmed" }
      });
    }

    return updated;
  });

  return serializeReviewItem(item);
}

export async function rejectReviewItem(reviewItemId: string) {
  const user = await getDefaultUser();
  const item = await prisma.$transaction(async (tx) => {
    const updated = await tx.reviewItem.update({
      where: {
        id: reviewItemId,
        userId: user.id
      },
      data: {
        status: "rejected",
        rejectedAt: new Date()
      },
      include: {
        ingestionTask: true
      }
    });

    if (updated.ingestionTaskId) {
      await tx.ingestionTask.update({
        where: { id: updated.ingestionTaskId },
        data: { status: "rejected" }
      });
    }

    return updated;
  });

  return serializeReviewItem(item);
}

function buildExternalConversationPreview(
  input: CreateExternalConversationIngestionInput
) {
  const domainName = input.target_domain_hint || "计算机";
  const topicName = inferTopicName(input);

  return {
    topic_suggestion: {
      domain_name: domainName,
      topic_name: topicName
    },
    knowledge_points_preview: [
      "workflow 文件结构",
      "触发条件",
      "jobs 与 steps 的关系"
    ],
    questions_preview: [
      {
        stem: `${topicName} 的核心概念是什么？`,
        cognitive_dimension: "understand",
        difficulty_level: 2
      },
      {
        stem: `如何在实际项目中应用 ${topicName}？`,
        cognitive_dimension: "apply",
        difficulty_level: 3
      }
    ]
  };
}

function inferTopicName(input: CreateExternalConversationIngestionInput) {
  const text = `${input.instruction} ${input.conversation_summary ?? ""} ${
    input.conversation_content ?? ""
  }`;

  if (/github actions/i.test(text)) {
    return "GitHub Actions";
  }

  return input.target_domain_hint ? `${input.target_domain_hint} 知识点` : "待确认主题";
}

function serializeIngestionTaskWithPreview(task: {
  id: string;
  ingestionType: string;
  status: string;
  resultPreviewJson: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewItems: Array<{ id: string }>;
}) {
  const preview = parseJsonObject(task.resultPreviewJson);

  return {
    ingestion_task_id: task.id,
    ingestion_type: task.ingestionType,
    status: task.status,
    ...preview,
    review_item_id: task.reviewItems[0]?.id ?? null,
    review_url: `http://localhost:3000/review/${task.id}`,
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString()
  };
}

function serializeReviewItem(item: {
  id: string;
  ingestionTaskId: string | null;
  targetType: string;
  targetId: string;
  previewJson: string;
  status: string;
  confirmedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  ingestionTask?: { id: string; status: string } | null;
}) {
  return {
    review_item_id: item.id,
    ingestion_task_id: item.ingestionTaskId,
    target_type: item.targetType,
    target_id: item.targetId,
    preview: parseJsonObject(item.previewJson),
    status: item.status,
    ingestion_task: item.ingestionTask
      ? {
          id: item.ingestionTask.id,
          status: item.ingestionTask.status
        }
      : undefined,
    confirmed_at: item.confirmedAt?.toISOString() ?? null,
    rejected_at: item.rejectedAt?.toISOString() ?? null,
    created_at: item.createdAt.toISOString(),
    updated_at: item.updatedAt.toISOString(),
    review_url: `http://localhost:3000/review/${item.id}`
  };
}

function parseJsonObject(value: string | null) {
  if (!value) {
    return {};
  }

  return JSON.parse(value) as Record<string, unknown>;
}

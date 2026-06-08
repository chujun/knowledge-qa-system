import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

import { defaultKnowledgeTypes } from "./default-types";

export const createDomainSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  trust_policy: z.record(z.string(), z.unknown()).optional(),
  sort_order: z.number().int().optional()
});

export const updateDomainSchema = createDomainSchema.partial();

export const createTopicSchema = z.object({
  domain_id: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  outline: z.unknown().optional(),
  suggested_level: z.string().trim().max(40).optional(),
  status: z.enum(["draft", "pending_confirmation", "confirmed", "archived"]).optional()
});

export const updateTopicSchema = createTopicSchema
  .omit({ domain_id: true })
  .partial();

export const createKnowledgePointSchema = z.object({
  domain_id: z.string().min(1),
  topic_id: z.string().min(1),
  knowledge_type_id: z.string().min(1),
  name: z.string().trim().min(1).max(240),
  description: z.string().trim().max(2000).optional(),
  complexity_level: z.enum(["simple", "medium", "complex"]).default("medium"),
  suggested_difficulty: z.number().int().min(1).max(5).default(3),
  status: z.enum(["draft", "pending_confirmation", "confirmed", "archived"]).optional()
});

export const updateKnowledgePointSchema = createKnowledgePointSchema
  .omit({ domain_id: true, topic_id: true, knowledge_type_id: true })
  .partial();

export type DomainInput = z.infer<typeof createDomainSchema>;
export type TopicInput = z.infer<typeof createTopicSchema>;
export type KnowledgePointInput = z.infer<typeof createKnowledgePointSchema>;

export async function getDefaultUser() {
  const existing = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      name: "Local User"
    }
  });
}

export async function ensureDefaultKnowledgeTypes() {
  const records = [];

  for (const type of defaultKnowledgeTypes) {
    records.push(
      await prisma.knowledgeType.upsert({
        where: { code: type.code },
        update: {
          name: type.name,
          description: type.description,
          explanationTemplateJson: JSON.stringify(type.explanationTemplate),
          status: "active"
        },
        create: {
          code: type.code,
          name: type.name,
          description: type.description,
          explanationTemplateJson: JSON.stringify(type.explanationTemplate),
          status: "active"
        }
      })
    );
  }

  return records;
}

export async function listDomains(params: {
  status?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await getDefaultUser();
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const where: Prisma.KnowledgeDomainWhereInput = {
    userId: user.id,
    ...(params.status ? { status: params.status } : {})
  };

  const [items, total] = await Promise.all([
    prisma.knowledgeDomain.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.knowledgeDomain.count({ where })
  ]);

  return { items: items.map(serializeDomain), page, pageSize, total };
}

export async function createDomain(input: DomainInput) {
  const user = await getDefaultUser();
  const domain = await prisma.knowledgeDomain.create({
    data: {
      userId: user.id,
      name: input.name,
      description: input.description,
      trustPolicyJson: input.trust_policy
        ? JSON.stringify(input.trust_policy)
        : undefined,
      sortOrder: input.sort_order ?? 0,
      status: "active"
    }
  });

  return serializeDomain(domain);
}

export async function updateDomain(domainId: string, input: z.infer<typeof updateDomainSchema>) {
  const user = await getDefaultUser();
  const domain = await prisma.knowledgeDomain.update({
    where: {
      id: domainId,
      userId: user.id
    },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.trust_policy !== undefined
        ? { trustPolicyJson: JSON.stringify(input.trust_policy) }
        : {}),
      ...(input.sort_order !== undefined ? { sortOrder: input.sort_order } : {})
    }
  });

  return serializeDomain(domain);
}

export async function archiveDomain(domainId: string) {
  return updateDomainStatus(domainId, "archived");
}

export async function listTopics(params: {
  domainId?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await getDefaultUser();
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const where: Prisma.KnowledgeTopicWhereInput = {
    userId: user.id,
    ...(params.domainId ? { domainId: params.domainId } : {}),
    ...(params.status ? { status: params.status } : {})
  };

  const [items, total] = await Promise.all([
    prisma.knowledgeTopic.findMany({
      where,
      include: { domain: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.knowledgeTopic.count({ where })
  ]);

  return { items: items.map(serializeTopic), page, pageSize, total };
}

export async function createTopic(input: TopicInput) {
  const user = await getDefaultUser();
  await assertDomainBelongsToUser(input.domain_id, user.id);

  const topic = await prisma.knowledgeTopic.create({
    data: {
      userId: user.id,
      domainId: input.domain_id,
      name: input.name,
      description: input.description,
      outlineJson: input.outline === undefined ? undefined : JSON.stringify(input.outline),
      suggestedLevel: input.suggested_level,
      status: input.status ?? "confirmed"
    },
    include: { domain: true }
  });

  return serializeTopic(topic);
}

export async function getTopic(topicId: string) {
  const user = await getDefaultUser();
  const topic = await prisma.knowledgeTopic.findFirst({
    where: { id: topicId, userId: user.id },
    include: { domain: true, knowledgePoints: true }
  });

  return topic ? serializeTopic(topic) : null;
}

export async function updateTopic(topicId: string, input: z.infer<typeof updateTopicSchema>) {
  const user = await getDefaultUser();
  const topic = await prisma.knowledgeTopic.update({
    where: {
      id: topicId,
      userId: user.id
    },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.outline !== undefined ? { outlineJson: JSON.stringify(input.outline) } : {}),
      ...(input.suggested_level !== undefined ? { suggestedLevel: input.suggested_level } : {}),
      ...(input.status !== undefined ? { status: input.status } : {})
    },
    include: { domain: true }
  });

  return serializeTopic(topic);
}

export async function listKnowledgeTypes() {
  const types = await ensureDefaultKnowledgeTypes();
  return types
    .filter((type) => type.status === "active")
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(serializeKnowledgeType);
}

export async function listKnowledgePoints(params: {
  topicId?: string | null;
  domainId?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await getDefaultUser();
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const where: Prisma.KnowledgePointWhereInput = {
    userId: user.id,
    ...(params.domainId ? { domainId: params.domainId } : {}),
    ...(params.topicId ? { topicId: params.topicId } : {}),
    ...(params.status ? { status: params.status } : {})
  };

  const [items, total] = await Promise.all([
    prisma.knowledgePoint.findMany({
      where,
      include: { domain: true, topic: true, knowledgeType: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.knowledgePoint.count({ where })
  ]);

  return { items: items.map(serializeKnowledgePoint), page, pageSize, total };
}

export async function createKnowledgePoint(input: KnowledgePointInput) {
  const user = await getDefaultUser();
  await assertDomainBelongsToUser(input.domain_id, user.id);
  await assertTopicBelongsToDomain(input.topic_id, input.domain_id, user.id);
  await assertKnowledgeTypeExists(input.knowledge_type_id);

  const point = await prisma.knowledgePoint.create({
    data: {
      userId: user.id,
      domainId: input.domain_id,
      topicId: input.topic_id,
      knowledgeTypeId: input.knowledge_type_id,
      name: input.name,
      description: input.description,
      complexityLevel: input.complexity_level,
      suggestedDifficulty: input.suggested_difficulty,
      status: input.status ?? "confirmed"
    },
    include: { domain: true, topic: true, knowledgeType: true }
  });

  return serializeKnowledgePoint(point);
}

export async function getKnowledgePoint(knowledgePointId: string) {
  const user = await getDefaultUser();
  const point = await prisma.knowledgePoint.findFirst({
    where: { id: knowledgePointId, userId: user.id },
    include: { domain: true, topic: true, knowledgeType: true }
  });

  return point ? serializeKnowledgePoint(point) : null;
}

export async function updateKnowledgePoint(
  knowledgePointId: string,
  input: z.infer<typeof updateKnowledgePointSchema>
) {
  const user = await getDefaultUser();
  const point = await prisma.knowledgePoint.update({
    where: {
      id: knowledgePointId,
      userId: user.id
    },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.complexity_level !== undefined
        ? { complexityLevel: input.complexity_level }
        : {}),
      ...(input.suggested_difficulty !== undefined
        ? { suggestedDifficulty: input.suggested_difficulty }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {})
    },
    include: { domain: true, topic: true, knowledgeType: true }
  });

  return serializeKnowledgePoint(point);
}

export async function archiveKnowledgePoint(knowledgePointId: string) {
  return updateKnowledgePoint(knowledgePointId, { status: "archived" });
}

function normalizePage(page?: number) {
  return Math.max(1, page ?? 1);
}

function normalizePageSize(pageSize?: number) {
  return Math.min(100, Math.max(1, pageSize ?? 20));
}

async function updateDomainStatus(domainId: string, status: string) {
  const user = await getDefaultUser();
  const domain = await prisma.knowledgeDomain.update({
    where: {
      id: domainId,
      userId: user.id
    },
    data: { status }
  });

  return serializeDomain(domain);
}

async function assertDomainBelongsToUser(domainId: string, userId: string) {
  const domain = await prisma.knowledgeDomain.findFirst({
    where: { id: domainId, userId }
  });

  if (!domain) {
    throw new Error("domain_not_found");
  }
}

async function assertTopicBelongsToDomain(
  topicId: string,
  domainId: string,
  userId: string
) {
  const topic = await prisma.knowledgeTopic.findFirst({
    where: { id: topicId, domainId, userId }
  });

  if (!topic) {
    throw new Error("topic_not_found");
  }
}

async function assertKnowledgeTypeExists(knowledgeTypeId: string) {
  const type = await prisma.knowledgeType.findFirst({
    where: { id: knowledgeTypeId, status: "active" }
  });

  if (!type) {
    throw new Error("knowledge_type_not_found");
  }
}

function serializeDomain(domain: {
  id: string;
  name: string;
  description: string | null;
  trustPolicyJson: string | null;
  sortOrder: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: domain.id,
    name: domain.name,
    description: domain.description,
    trust_policy: parseJson(domain.trustPolicyJson),
    sort_order: domain.sortOrder,
    status: domain.status,
    created_at: domain.createdAt.toISOString(),
    updated_at: domain.updatedAt.toISOString()
  };
}

function serializeTopic(topic: {
  id: string;
  domainId: string;
  name: string;
  description: string | null;
  outlineJson: string | null;
  suggestedLevel: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  domain?: { id: string; name: string } | null;
}) {
  return {
    id: topic.id,
    domain_id: topic.domainId,
    domain: topic.domain
      ? {
          id: topic.domain.id,
          name: topic.domain.name
        }
      : undefined,
    name: topic.name,
    description: topic.description,
    outline: parseJson(topic.outlineJson),
    suggested_level: topic.suggestedLevel,
    status: topic.status,
    created_at: topic.createdAt.toISOString(),
    updated_at: topic.updatedAt.toISOString()
  };
}

function serializeKnowledgeType(type: {
  id: string;
  code: string;
  name: string;
  description: string | null;
  explanationTemplateJson: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: type.id,
    code: type.code,
    name: type.name,
    description: type.description,
    explanation_template: parseJson(type.explanationTemplateJson),
    status: type.status,
    created_at: type.createdAt.toISOString(),
    updated_at: type.updatedAt.toISOString()
  };
}

function serializeKnowledgePoint(point: {
  id: string;
  domainId: string;
  topicId: string;
  knowledgeTypeId: string;
  name: string;
  description: string | null;
  complexityLevel: string;
  suggestedDifficulty: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  domain?: { id: string; name: string } | null;
  topic?: { id: string; name: string } | null;
  knowledgeType?: { id: string; code: string; name: string } | null;
}) {
  return {
    id: point.id,
    domain_id: point.domainId,
    domain: point.domain
      ? {
          id: point.domain.id,
          name: point.domain.name
        }
      : undefined,
    topic_id: point.topicId,
    topic: point.topic
      ? {
          id: point.topic.id,
          name: point.topic.name
        }
      : undefined,
    knowledge_type_id: point.knowledgeTypeId,
    knowledge_type: point.knowledgeType
      ? {
          id: point.knowledgeType.id,
          code: point.knowledgeType.code,
          name: point.knowledgeType.name
        }
      : undefined,
    name: point.name,
    description: point.description,
    complexity_level: point.complexityLevel,
    suggested_difficulty: point.suggestedDifficulty,
    status: point.status,
    created_at: point.createdAt.toISOString(),
    updated_at: point.updatedAt.toISOString()
  };
}

function parseJson(value: string | null) {
  if (!value) {
    return null;
  }

  return JSON.parse(value);
}

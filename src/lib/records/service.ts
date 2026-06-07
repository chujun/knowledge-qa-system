import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getDefaultUser } from "@/lib/knowledge/service";

export async function listSourceReferences(params: {
  sourceType?: string | null;
  sourceSystem?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await getDefaultUser();
  const { page, pageSize } = normalizePagination(params);
  const where: Prisma.SourceReferenceWhereInput = {
    userId: user.id,
    ...(params.sourceType ? { sourceType: params.sourceType } : {}),
    ...(params.sourceSystem ? { sourceSystem: params.sourceSystem } : {})
  };

  const [items, total] = await Promise.all([
    prisma.sourceReference.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.sourceReference.count({ where })
  ]);

  return { items: items.map(serializeSourceReference), page, pageSize, total };
}

export async function listGenerationRecords(params: {
  targetType?: string | null;
  targetId?: string | null;
  modelName?: string | null;
  aiAgent?: string | null;
  callType?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await getDefaultUser();
  const { page, pageSize } = normalizePagination(params);
  const where: Prisma.GenerationRecordWhereInput = {
    userId: user.id,
    ...(params.targetType ? { targetType: params.targetType } : {}),
    ...(params.targetId ? { targetId: params.targetId } : {}),
    ...(params.modelName ? { modelName: params.modelName } : {}),
    ...(params.aiAgent ? { aiAgent: params.aiAgent } : {}),
    ...(params.callType ? { callType: params.callType } : {})
  };

  const [items, total] = await Promise.all([
    prisma.generationRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.generationRecord.count({ where })
  ]);

  return { items: items.map(serializeGenerationRecord), page, pageSize, total };
}

export async function listQualityChecks(params: {
  questionId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  status?: string | null;
  checkerType?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const user = await getDefaultUser();
  const { page, pageSize } = normalizePagination(params);
  const where: Prisma.QualityCheckRecordWhereInput = {
    userId: user.id,
    ...(params.questionId ? { questionId: params.questionId } : {}),
    ...(params.targetType ? { targetType: params.targetType } : {}),
    ...(params.targetId ? { targetId: params.targetId } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.checkerType ? { checkerType: params.checkerType } : {})
  };

  const [items, total] = await Promise.all([
    prisma.qualityCheckRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.qualityCheckRecord.count({ where })
  ]);

  return { items: items.map(serializeQualityCheck), page, pageSize, total };
}

function normalizePagination(params: { page?: number; pageSize?: number }) {
  return {
    page: Math.max(1, params.page ?? 1),
    pageSize: Math.min(100, Math.max(1, params.pageSize ?? 20))
  };
}

function serializeSourceReference(source: {
  id: string;
  sourceType: string;
  sourceSystem: string | null;
  sourceTitle: string | null;
  sourceContent: string | null;
  sourceSummary: string | null;
  sourceUrlOrFileId: string | null;
  conversationId: string | null;
  sourceTimestamp: Date | null;
  trustLevel: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: source.id,
    source_type: source.sourceType,
    source_system: source.sourceSystem,
    source_title: source.sourceTitle,
    source_content_length: source.sourceContent?.length ?? 0,
    source_summary: source.sourceSummary,
    source_url_or_file_id: source.sourceUrlOrFileId,
    conversation_id: source.conversationId,
    source_timestamp: source.sourceTimestamp?.toISOString() ?? null,
    trust_level: source.trustLevel,
    created_at: source.createdAt.toISOString(),
    updated_at: source.updatedAt.toISOString()
  };
}

function serializeGenerationRecord(record: {
  id: string;
  targetType: string;
  targetId: string;
  callType: string;
  modelName: string;
  modelVersion: string | null;
  aiAgent: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  cost: Prisma.Decimal | null;
  status: string;
  promptHash: string | null;
  responseHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    target_type: record.targetType,
    target_id: record.targetId,
    call_type: record.callType,
    model_name: record.modelName,
    model_version: record.modelVersion,
    ai_agent: record.aiAgent,
    prompt_version: record.promptVersion,
    input_tokens: record.inputTokens,
    output_tokens: record.outputTokens,
    latency_ms: record.latencyMs,
    cost: record.cost?.toString() ?? null,
    status: record.status,
    prompt_hash: record.promptHash,
    response_hash: record.responseHash,
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString()
  };
}

function serializeQualityCheck(record: {
  id: string;
  questionId: string | null;
  targetType: string;
  targetId: string;
  checkerType: string;
  modelName: string | null;
  aiAgent: string | null;
  ruleResultJson: string | null;
  aiResultJson: string | null;
  autoFixCount: number;
  status: string;
  passedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: record.id,
    question_id: record.questionId,
    target_type: record.targetType,
    target_id: record.targetId,
    checker_type: record.checkerType,
    model_name: record.modelName,
    ai_agent: record.aiAgent,
    rule_result: parseJson(record.ruleResultJson),
    ai_result: parseJson(record.aiResultJson),
    auto_fix_count: record.autoFixCount,
    status: record.status,
    passed_at: record.passedAt?.toISOString() ?? null,
    created_at: record.createdAt.toISOString(),
    updated_at: record.updatedAt.toISOString()
  };
}

function parseJson(value: string | null) {
  if (!value) {
    return null;
  }

  return JSON.parse(value);
}

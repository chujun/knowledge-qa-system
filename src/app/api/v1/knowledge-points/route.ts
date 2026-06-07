import { ZodError } from "zod";

import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, listOk, ok } from "@/lib/api/responses";
import { formatZodError, getPagination } from "@/lib/api/validation";
import {
  createKnowledgePoint,
  createKnowledgePointSchema,
  listKnowledgePoints
} from "@/lib/knowledge/service";

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const result = await listKnowledgePoints({
    domainId: url.searchParams.get("domain_id"),
    topicId: url.searchParams.get("topic_id"),
    status: url.searchParams.get("status"),
    ...getPagination(url.searchParams)
  });

  return listOk(result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total
  });
}

export async function POST(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const input = createKnowledgePointSchema.parse(await request.json());
    const point = await createKnowledgePoint(input);
    return ok(point, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "请求参数不合法",
        formatZodError(error)
      );
    }

    if (error instanceof Error) {
      const messages: Record<string, string> = {
        domain_not_found: "知识领域不存在",
        topic_not_found: "知识主题不存在",
        knowledge_type_not_found: "知识类型不存在"
      };

      if (messages[error.message]) {
        return errorResponse(404, "NOT_FOUND", messages[error.message]);
      }
    }

    return errorResponse(500, "INTERNAL_ERROR", "创建知识点失败");
  }
}

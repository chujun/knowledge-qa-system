import { ZodError } from "zod";

import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, listOk, ok } from "@/lib/api/responses";
import { formatZodError, getPagination } from "@/lib/api/validation";
import {
  createTopic,
  createTopicSchema,
  listTopics
} from "@/lib/knowledge/service";

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const result = await listTopics({
    domainId: url.searchParams.get("domain_id"),
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
    const input = createTopicSchema.parse(await request.json());
    const topic = await createTopic(input);
    return ok(topic, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "请求参数不合法",
        formatZodError(error)
      );
    }

    if (error instanceof Error && error.message === "domain_not_found") {
      return errorResponse(404, "NOT_FOUND", "知识领域不存在");
    }

    return errorResponse(500, "INTERNAL_ERROR", "创建知识主题失败");
  }
}

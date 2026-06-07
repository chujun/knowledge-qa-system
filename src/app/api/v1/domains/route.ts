import { ZodError } from "zod";

import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, listOk, ok } from "@/lib/api/responses";
import { formatZodError, getPagination } from "@/lib/api/validation";
import {
  createDomain,
  createDomainSchema,
  listDomains
} from "@/lib/knowledge/service";

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const result = await listDomains({
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
    const input = createDomainSchema.parse(await request.json());
    const domain = await createDomain(input);
    return ok(domain, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "请求参数不合法",
        formatZodError(error)
      );
    }

    return errorResponse(500, "INTERNAL_ERROR", "创建知识领域失败");
  }
}

import { ZodError } from "zod";

import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { formatZodError } from "@/lib/api/validation";
import { updateDomain, updateDomainSchema } from "@/lib/knowledge/service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ domainId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { domainId } = await context.params;

  try {
    const input = updateDomainSchema.parse(await request.json());
    return ok(await updateDomain(domainId, input));
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "请求参数不合法",
        formatZodError(error)
      );
    }

    return errorResponse(404, "NOT_FOUND", "知识领域不存在");
  }
}

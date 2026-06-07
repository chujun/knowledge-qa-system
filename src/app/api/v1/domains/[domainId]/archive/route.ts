import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { archiveDomain } from "@/lib/knowledge/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ domainId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { domainId } = await context.params;

  try {
    return ok(await archiveDomain(domainId));
  } catch {
    return errorResponse(404, "NOT_FOUND", "知识领域不存在");
  }
}

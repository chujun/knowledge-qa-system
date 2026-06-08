import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { resolveErrorSet } from "@/lib/practice/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ errorSetId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { errorSetId } = await context.params;

  try {
    return ok(await resolveErrorSet(errorSetId));
  } catch {
    return errorResponse(404, "NOT_FOUND", "错误集不存在");
  }
}

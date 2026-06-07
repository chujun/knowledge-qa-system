import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { getPracticeSession } from "@/lib/practice/service";

export async function GET(
  request: Request,
  context: { params: Promise<{ practiceSessionId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { practiceSessionId } = await context.params;
  const session = await getPracticeSession(practiceSessionId);

  if (!session) {
    return errorResponse(404, "NOT_FOUND", "练习会话不存在");
  }

  return ok(session);
}

import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { confirmQuestion } from "@/lib/questions/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { questionId } = await context.params;

  try {
    return ok(await confirmQuestion(questionId));
  } catch {
    return errorResponse(404, "NOT_FOUND", "题目不存在");
  }
}

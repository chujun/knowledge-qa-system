import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { getQuestion } from "@/lib/questions/service";

export async function GET(
  request: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { questionId } = await context.params;
  const question = await getQuestion(questionId);

  if (!question) {
    return errorResponse(404, "NOT_FOUND", "题目不存在");
  }

  return ok(question);
}

import { ZodError } from "zod";

import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { formatZodError } from "@/lib/api/validation";
import { confirmScore, confirmScoreSchema } from "@/lib/practice/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { attemptId } = await context.params;

  try {
    const input = confirmScoreSchema.parse(await request.json());
    return ok(await confirmScore(attemptId, input));
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "请求参数不合法",
        formatZodError(error)
      );
    }

    return errorResponse(404, "NOT_FOUND", "答题记录不存在");
  }
}

import { z, ZodError } from "zod";

import { AiProviderError } from "@/lib/ai/provider";
import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { formatZodError } from "@/lib/api/validation";
import {
  submitAnswerAttempt,
  submitAnswerAttemptSchema
} from "@/lib/practice/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { questionId } = await context.params;
  let input: z.infer<typeof submitAnswerAttemptSchema>;

  try {
    input = submitAnswerAttemptSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "请求参数不合法",
        formatZodError(error)
      );
    }

    return errorResponse(400, "INVALID_JSON", "请求 JSON 不合法");
  }

  try {
    return ok(await submitAnswerAttempt(questionId, input), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "active_versions_not_found") {
      return errorResponse(409, "ACTIVE_VERSION_REQUIRED", "题目缺少 active 版本");
    }

    if (error instanceof Error && error.message === "question_not_found") {
      return errorResponse(404, "NOT_FOUND", "题目不存在或尚未确认");
    }

    if (error instanceof AiProviderError || error instanceof ZodError) {
      return errorResponse(502, "ANSWER_SCORING_FAILED", "AI 答题评分失败");
    }

    return errorResponse(404, "NOT_FOUND", "题目不存在或尚未确认");
  }
}

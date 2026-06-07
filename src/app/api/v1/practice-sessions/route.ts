import { ZodError } from "zod";

import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { formatZodError } from "@/lib/api/validation";
import {
  createPracticeSession,
  createPracticeSessionSchema
} from "@/lib/practice/service";

export async function POST(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const input = createPracticeSessionSchema.parse(await request.json());
    return ok(await createPracticeSession(input), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "请求参数不合法",
        formatZodError(error)
      );
    }

    if (error instanceof Error && error.message === "no_practice_questions_found") {
      return errorResponse(404, "NOT_FOUND", "没有找到可练习的已确认题目");
    }

    return errorResponse(500, "INTERNAL_ERROR", "创建练习会话失败");
  }
}

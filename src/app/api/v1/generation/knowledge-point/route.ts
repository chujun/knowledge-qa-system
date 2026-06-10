import { ZodError } from "zod";

import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { formatZodError } from "@/lib/api/validation";
import {
  generateForKnowledgePoint,
  generateForKnowledgePointSchema
} from "@/lib/questions/service";

export async function POST(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const input = generateForKnowledgePointSchema.parse(await request.json());
    return ok(await generateForKnowledgePoint(input), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "请求参数不合法",
        formatZodError(error)
      );
    }

    if (error instanceof Error && error.message === "knowledge_point_not_found") {
      return errorResponse(404, "NOT_FOUND", "知识点不存在");
    }

    if (error instanceof Error && error.message === "model_generation_failed") {
      return errorResponse(502, "MODEL_PROVIDER_ERROR", "模型生成失败");
    }

    return errorResponse(500, "INTERNAL_ERROR", "生成题目和讲解失败");
  }
}

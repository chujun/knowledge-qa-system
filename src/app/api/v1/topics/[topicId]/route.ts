import { ZodError } from "zod";

import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { formatZodError } from "@/lib/api/validation";
import {
  getTopic,
  updateTopic,
  updateTopicSchema
} from "@/lib/knowledge/service";

export async function GET(
  request: Request,
  context: { params: Promise<{ topicId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { topicId } = await context.params;
  const topic = await getTopic(topicId);

  if (!topic) {
    return errorResponse(404, "NOT_FOUND", "知识主题不存在");
  }

  return ok(topic);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ topicId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { topicId } = await context.params;

  try {
    const input = updateTopicSchema.parse(await request.json());
    return ok(await updateTopic(topicId, input));
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "请求参数不合法",
        formatZodError(error)
      );
    }

    return errorResponse(404, "NOT_FOUND", "知识主题不存在");
  }
}

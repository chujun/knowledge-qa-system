import { ZodError } from "zod";

import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { formatZodError } from "@/lib/api/validation";
import {
  createExternalConversationIngestion,
  createExternalConversationIngestionSchema
} from "@/lib/ingestion/service";

export async function POST(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const input = createExternalConversationIngestionSchema.parse(
      await request.json()
    );
    const result = await createExternalConversationIngestion(input);
    return ok(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "请求参数不合法",
        formatZodError(error)
      );
    }

    return errorResponse(500, "INTERNAL_ERROR", "创建知识沉淀任务失败");
  }
}

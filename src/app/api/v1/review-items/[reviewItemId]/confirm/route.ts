import { ZodError } from "zod";

import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { formatZodError } from "@/lib/api/validation";
import {
  confirmReviewItem,
  confirmReviewItemSchema
} from "@/lib/ingestion/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ reviewItemId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { reviewItemId } = await context.params;

  try {
    const input = confirmReviewItemSchema.parse(await request.json());
    return ok(await confirmReviewItem(reviewItemId, input));
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "请求参数不合法",
        formatZodError(error)
      );
    }

    return errorResponse(404, "NOT_FOUND", "待确认项不存在");
  }
}

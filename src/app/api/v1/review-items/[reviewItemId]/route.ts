import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { getReviewItem } from "@/lib/ingestion/service";

export async function GET(
  request: Request,
  context: { params: Promise<{ reviewItemId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { reviewItemId } = await context.params;
  const item = await getReviewItem(reviewItemId);

  if (!item) {
    return errorResponse(404, "NOT_FOUND", "待确认项不存在");
  }

  return ok(item);
}

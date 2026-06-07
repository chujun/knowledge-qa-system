import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { rejectReviewItem } from "@/lib/ingestion/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ reviewItemId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { reviewItemId } = await context.params;

  try {
    return ok(await rejectReviewItem(reviewItemId));
  } catch {
    return errorResponse(404, "NOT_FOUND", "待确认项不存在");
  }
}

import { requireApiKey } from "@/lib/api/auth";
import { listOk } from "@/lib/api/responses";
import { getPagination } from "@/lib/api/validation";
import { listQualityChecks } from "@/lib/records/service";

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const result = await listQualityChecks({
    questionId: url.searchParams.get("question_id"),
    targetType: url.searchParams.get("target_type"),
    targetId: url.searchParams.get("target_id"),
    status: url.searchParams.get("status"),
    checkerType: url.searchParams.get("checker_type"),
    ...getPagination(url.searchParams)
  });

  return listOk(result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total
  });
}

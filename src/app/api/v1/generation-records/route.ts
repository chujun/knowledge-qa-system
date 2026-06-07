import { requireApiKey } from "@/lib/api/auth";
import { listOk } from "@/lib/api/responses";
import { getPagination } from "@/lib/api/validation";
import { listGenerationRecords } from "@/lib/records/service";

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const result = await listGenerationRecords({
    targetType: url.searchParams.get("target_type"),
    targetId: url.searchParams.get("target_id"),
    modelName: url.searchParams.get("model_name"),
    aiAgent: url.searchParams.get("ai_agent"),
    callType: url.searchParams.get("call_type"),
    ...getPagination(url.searchParams)
  });

  return listOk(result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total
  });
}

import { requireApiKey } from "@/lib/api/auth";
import { listOk } from "@/lib/api/responses";
import { getPagination } from "@/lib/api/validation";
import { listErrorSets } from "@/lib/practice/service";

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const result = await listErrorSets({
    knowledgePointId: url.searchParams.get("knowledge_point_id"),
    status: url.searchParams.get("status"),
    ...getPagination(url.searchParams)
  });

  return listOk(result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total
  });
}

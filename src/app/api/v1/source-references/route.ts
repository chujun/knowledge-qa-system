import { requireApiKey } from "@/lib/api/auth";
import { listOk } from "@/lib/api/responses";
import { getPagination } from "@/lib/api/validation";
import { listSourceReferences } from "@/lib/records/service";

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const result = await listSourceReferences({
    sourceType: url.searchParams.get("source_type"),
    sourceSystem: url.searchParams.get("source_system"),
    ...getPagination(url.searchParams)
  });

  return listOk(result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total
  });
}

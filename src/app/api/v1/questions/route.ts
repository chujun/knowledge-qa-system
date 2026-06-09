import { requireApiKey } from "@/lib/api/auth";
import { listOk } from "@/lib/api/responses";
import { getPagination } from "@/lib/api/validation";
import { listQuestions } from "@/lib/questions/service";

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const result = await listQuestions({
    knowledgePointId: url.searchParams.get("knowledge_point_id"),
    status: url.searchParams.get("status"),
    cognitiveDimension: url.searchParams.get("cognitive_dimension"),
    difficultyLevel: parseOptionalNumber(url.searchParams.get("difficulty_level")),
    ...getPagination(url.searchParams)
  });

  return listOk(result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total
  });
}

function parseOptionalNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

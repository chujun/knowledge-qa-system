import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { getKnowledgePoint } from "@/lib/knowledge/service";

export async function GET(
  request: Request,
  context: { params: Promise<{ knowledgePointId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { knowledgePointId } = await context.params;
  const point = await getKnowledgePoint(knowledgePointId);

  if (!point) {
    return errorResponse(404, "NOT_FOUND", "知识点不存在");
  }

  return ok(point);
}

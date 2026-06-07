import { requireApiKey } from "@/lib/api/auth";
import { errorResponse, ok } from "@/lib/api/responses";
import { getIngestionTask } from "@/lib/ingestion/service";

export async function GET(
  request: Request,
  context: { params: Promise<{ ingestionTaskId: string }> }
) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { ingestionTaskId } = await context.params;
  const task = await getIngestionTask(ingestionTaskId);

  if (!task) {
    return errorResponse(404, "NOT_FOUND", "知识沉淀任务不存在");
  }

  return ok(task);
}

import { requireApiKey } from "@/lib/api/auth";
import { ok } from "@/lib/api/responses";
import { listKnowledgeTypes } from "@/lib/knowledge/service";

export async function GET(request: Request) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  return ok(await listKnowledgeTypes());
}

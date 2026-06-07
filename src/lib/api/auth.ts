import { appConfig } from "@/lib/config";
import { verifyApiKey } from "@/lib/auth/api-key";

import { errorResponse } from "./responses";

export function requireApiKey(request: Request) {
  const result = verifyApiKey({
    configuredApiKey: process.env.KNOWLEDGE_QA_API_KEY,
    xApiKey: request.headers.get("x-api-key"),
    authorization: request.headers.get("authorization")
  });

  if (result.ok) {
    return null;
  }

  if (!appConfig.apiKeyConfigured) {
    return errorResponse(
      401,
      "API_KEY_NOT_CONFIGURED",
      "本地 API Key 尚未配置"
    );
  }

  return errorResponse(401, "UNAUTHORIZED", "API Key 缺失或无效");
}

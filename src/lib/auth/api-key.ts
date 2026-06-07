export interface ApiKeyAuthInput {
  configuredApiKey?: string | null;
  xApiKey?: string | null;
  authorization?: string | null;
}

export type ApiKeyAuthResult =
  | { ok: true }
  | { ok: false; code: "api_key_not_configured" | "api_key_missing" | "api_key_invalid" };

export function verifyApiKey(input: ApiKeyAuthInput): ApiKeyAuthResult {
  const configuredApiKey = input.configuredApiKey?.trim();

  if (!configuredApiKey) {
    return { ok: false, code: "api_key_not_configured" };
  }

  const providedApiKey = extractProvidedApiKey(input);

  if (!providedApiKey) {
    return { ok: false, code: "api_key_missing" };
  }

  if (providedApiKey !== configuredApiKey) {
    return { ok: false, code: "api_key_invalid" };
  }

  return { ok: true };
}

function extractProvidedApiKey(input: ApiKeyAuthInput): string | null {
  if (input.xApiKey?.trim()) {
    return input.xApiKey.trim();
  }

  const authorization = input.authorization?.trim();

  if (!authorization) {
    return null;
  }

  const bearerPrefix = "Bearer ";

  if (!authorization.startsWith(bearerPrefix)) {
    return null;
  }

  return authorization.slice(bearerPrefix.length).trim() || null;
}

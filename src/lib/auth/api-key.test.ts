import { verifyApiKey } from "./api-key";

describe("api key auth", () => {
  it("accepts X-API-Key when it matches the configured key", () => {
    expect(
      verifyApiKey({
        configuredApiKey: "local-secret",
        xApiKey: "local-secret"
      })
    ).toEqual({ ok: true });
  });

  it("accepts Authorization Bearer when it matches the configured key", () => {
    expect(
      verifyApiKey({
        configuredApiKey: "local-secret",
        authorization: "Bearer local-secret"
      })
    ).toEqual({ ok: true });
  });

  it("rejects missing, invalid, or unconfigured API keys", () => {
    expect(
      verifyApiKey({
        configuredApiKey: "local-secret"
      })
    ).toEqual({ ok: false, code: "api_key_missing" });

    expect(
      verifyApiKey({
        configuredApiKey: "local-secret",
        xApiKey: "wrong-secret"
      })
    ).toEqual({ ok: false, code: "api_key_invalid" });

    expect(
      verifyApiKey({
        configuredApiKey: "",
        xApiKey: "local-secret"
      })
    ).toEqual({ ok: false, code: "api_key_not_configured" });
  });
});

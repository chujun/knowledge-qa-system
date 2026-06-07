import {
  buildExternalConversationIdempotencyKey,
  findIdempotentIngestionTask
} from "./ingestion";

describe("external conversation ingestion", () => {
  it("builds a stable idempotency key from agent source, conversation, and instruction", () => {
    const first = buildExternalConversationIdempotencyKey({
      sourceSystem: "Codex",
      conversationId: "codex-local-001",
      instruction: "生成理解型和应用型问答"
    });
    const second = buildExternalConversationIdempotencyKey({
      sourceSystem: " codex ",
      conversationId: "CODEX local 001",
      instruction: " 生成理解型和应用型问答 "
    });

    expect(first).toBe(second);
  });

  it("uses an explicit idempotency key when the agent provides one", () => {
    expect(
      buildExternalConversationIdempotencyKey({
        sourceSystem: "Codex",
        conversationId: "codex-local-001",
        instruction: "生成理解型和应用型问答",
        idempotencyKey: "custom-key-001"
      })
    ).toBe("custom-key-001");
  });

  it("returns the existing ingestion task for duplicate submissions", () => {
    const submission = {
      sourceSystem: "Codex",
      conversationId: "codex-local-001",
      instruction: "生成理解型和应用型问答"
    };
    const idempotencyKey =
      buildExternalConversationIdempotencyKey(submission);

    expect(
      findIdempotentIngestionTask(submission, [
        {
          ingestionTaskId: "ing_1",
          idempotencyKey,
          status: "pending_review"
        }
      ])
    ).toEqual({
      ingestionTaskId: "ing_1",
      idempotencyKey,
      status: "pending_review"
    });
  });
});

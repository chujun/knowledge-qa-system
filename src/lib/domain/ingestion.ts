export interface ExternalConversationSubmission {
  sourceSystem: string;
  conversationId?: string | null;
  instruction: string;
  idempotencyKey?: string | null;
}

export interface ExistingIngestionTask {
  ingestionTaskId: string;
  idempotencyKey: string;
  status: string;
}

export function buildExternalConversationIdempotencyKey(
  submission: ExternalConversationSubmission
): string {
  if (submission.idempotencyKey?.trim()) {
    return submission.idempotencyKey.trim();
  }

  const source = normalizeKeyPart(submission.sourceSystem);
  const conversation = normalizeKeyPart(submission.conversationId || "no-conversation");
  const instructionHash = hashString(normalizeInstruction(submission.instruction));

  return `${source}:${conversation}:${instructionHash}`;
}

export function findIdempotentIngestionTask(
  submission: ExternalConversationSubmission,
  existingTasks: ExistingIngestionTask[]
): ExistingIngestionTask | null {
  const idempotencyKey = buildExternalConversationIdempotencyKey(submission);

  return (
    existingTasks.find((task) => task.idempotencyKey === idempotencyKey) ?? null
  );
}

function normalizeKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

function normalizeInstruction(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function hashString(value: string): string {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(16);
}

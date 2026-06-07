import { buildExternalConversationIdempotencyKey } from "../domain/ingestion";
import {
  createFromConversationInputSchema,
  createFromConversationOutputSchema,
  type CreateFromConversationInput,
  type CreateFromConversationOutput
} from "./tools";

export interface SimulatedAgentCallRecord {
  sourceSystem: string;
  aiAgent: string;
  modelName: string;
  modelVersion: string;
  promptVersion: string;
  callType: "agent_ingestion";
  latencyMs: number;
  status: "succeeded";
}

export interface SimulatedAgentIngestionResult {
  output: CreateFromConversationOutput;
  idempotencyKey: string;
  callRecord: SimulatedAgentCallRecord;
}

export function simulateCreateFromConversationAgentCall(
  input: CreateFromConversationInput,
  options: {
    appBaseUrl?: string;
    aiAgent?: string;
    modelName?: string;
    modelVersion?: string;
    promptVersion?: string;
  } = {}
): SimulatedAgentIngestionResult {
  const parsedInput = createFromConversationInputSchema.parse(input);
  const idempotencyKey = buildExternalConversationIdempotencyKey({
    sourceSystem: parsedInput.source_system,
    conversationId: parsedInput.conversation_id,
    instruction: parsedInput.instruction,
    idempotencyKey: parsedInput.idempotency_key
  });
  const ingestionTaskId = `ing_${idempotencyKey.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const appBaseUrl = options.appBaseUrl ?? "http://localhost:3000";

  const output = createFromConversationOutputSchema.parse({
    ingestion_task_id: ingestionTaskId,
    status: "pending_review",
    topic_suggestion: {
      domain_name: parsedInput.target_domain_hint ?? "计算机",
      topic_name: "GitHub Actions"
    },
    knowledge_points_preview: [
      "workflow 触发条件",
      "jobs 与 steps 的关系",
      "runner 与 secrets 的基础使用"
    ],
    questions_preview: [
      {
        stem: "GitHub Actions 中 jobs 和 steps 的区别是什么？",
        cognitive_dimension: "distinguish",
        difficulty_level: 2
      },
      {
        stem: "如何为一个 Node.js 项目编写 push 触发的 workflow？",
        cognitive_dimension: "apply",
        difficulty_level: 3
      }
    ],
    review_url: `${appBaseUrl}/review/${ingestionTaskId}`,
    message: "已生成待确认知识沉淀，可在知识问答系统中查看和编辑。"
  });

  return {
    output,
    idempotencyKey,
    callRecord: {
      sourceSystem: parsedInput.source_system,
      aiAgent: options.aiAgent ?? "Codex",
      modelName: options.modelName ?? "chatgpt-5.5",
      modelVersion: options.modelVersion ?? "mock",
      promptVersion: options.promptVersion ?? "agent-ingestion-v1",
      callType: "agent_ingestion",
      latencyMs: 1,
      status: "succeeded"
    }
  };
}

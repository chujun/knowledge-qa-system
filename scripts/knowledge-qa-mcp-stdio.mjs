#!/usr/bin/env node

const apiBaseUrl =
  process.env.KNOWLEDGE_QA_API_BASE_URL || "http://localhost:3000/api/v1";
const apiKey = process.env.KNOWLEDGE_QA_API_KEY;

const tools = [
  {
    name: "qa_create_from_conversation",
    description: "从外部 AI Agent 会话内容创建知识问答沉淀任务，并返回待确认链接。",
    inputSchema: {
      type: "object",
      required: ["source_system", "context_type", "instruction"],
      properties: {
        source_system: { type: "string" },
        conversation_id: { type: "string" },
        context_type: {
          type: "string",
          enum: ["full_conversation", "recent_turns", "selected_excerpt", "summary"]
        },
        conversation_content: { type: "string" },
        conversation_summary: { type: "string" },
        source_model_name: { type: "string" },
        source_model_version: { type: "string" },
        instruction: { type: "string" },
        target_topic_id: { type: "string" },
        target_domain_hint: { type: "string" },
        direct_confirm: { type: "boolean", default: false },
        idempotency_key: { type: "string" }
      }
    }
  },
  {
    name: "qa_get_review_queue",
    description: "查询知识问答系统的待确认队列。",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", default: "pending" },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 }
      }
    }
  },
  {
    name: "qa_confirm_ingestion",
    description: "轻量确认某个待确认项。",
    inputSchema: {
      type: "object",
      required: ["review_item_id"],
      properties: {
        review_item_id: { type: "string" },
        edits: { type: "object" },
        include_existing_attempts_in_mastery: { type: "boolean", default: false }
      }
    }
  },
  {
    name: "qa_create_practice_session",
    description: "根据知识点、主题或领域创建针对性练习会话。",
    inputSchema: {
      type: "object",
      required: ["target_type", "target_id"],
      properties: {
        session_type: {
          type: "string",
          enum: ["knowledge_point", "topic", "domain", "error_set"],
          default: "knowledge_point"
        },
        target_type: {
          type: "string",
          enum: ["knowledge_point", "topic", "domain"]
        },
        target_id: { type: "string" },
        strategy: {
          type: "object",
          properties: {
            prefer_weak_dimensions: { type: "boolean", default: true },
            include_error_set: { type: "boolean", default: true },
            question_count: { type: "integer", minimum: 1, maximum: 20, default: 5 },
            difficulty_min: { type: "integer", minimum: 1, maximum: 5 },
            difficulty_max: { type: "integer", minimum: 1, maximum: 5 }
          }
        }
      }
    }
  }
];

if (process.argv.includes("--self-check")) {
  const initialize = await handleRequest("initialize", {});
  const toolsList = await handleRequest("tools/list", {});

  if (!initialize.serverInfo?.name) {
    throw new Error("initialize response missing serverInfo.name");
  }

  if (!Array.isArray(toolsList.tools) || toolsList.tools.length !== tools.length) {
    throw new Error("tools/list response missing tools");
  }

  process.stdout.write("MCP stdio self-check passed\n");
  process.exit(0);
}

let buffer = Buffer.alloc(0);

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  readMessages();
});

process.stdin.on("error", (error) => {
  process.stderr.write(`stdin error: ${error.message}\n`);
});

function readMessages() {
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");

    if (headerEnd === -1) {
      return;
    }

    const header = buffer.slice(0, headerEnd).toString("utf8");
    const match = /Content-Length:\s*(\d+)/i.exec(header);

    if (!match) {
      process.stderr.write("Invalid MCP message: missing Content-Length\n");
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }

    const length = Number.parseInt(match[1], 10);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + length;

    if (buffer.length < messageEnd) {
      return;
    }

    const raw = buffer.slice(messageStart, messageEnd).toString("utf8");
    buffer = buffer.slice(messageEnd);
    void handleRawMessage(raw);
  }
}

async function handleRawMessage(raw) {
  let message;

  try {
    message = JSON.parse(raw);
  } catch {
    writeMessage({
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse error" },
      id: null
    });
    return;
  }

  if (message.id === undefined) {
    return;
  }

  try {
    const result = await handleRequest(message.method, message.params || {});
    writeMessage({
      jsonrpc: "2.0",
      id: message.id,
      result
    });
  } catch (error) {
    writeMessage({
      jsonrpc: "2.0",
      id: message.id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : "Unknown error"
      }
    });
  }
}

async function handleRequest(method, params) {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "knowledge-qa-mcp-server",
          version: "0.1.0"
        }
      };
    case "tools/list":
      return { tools };
    case "tools/call":
      return callTool(params.name, params.arguments || {});
    default:
      throw new Error(`Unsupported MCP method: ${method}`);
  }
}

async function callTool(name, input) {
  ensureApiKey();

  let result;

  switch (name) {
    case "qa_create_from_conversation":
      result = await createFromConversation(input);
      break;
    case "qa_get_review_queue":
      result = await getReviewQueue(input);
      break;
    case "qa_confirm_ingestion":
      result = await confirmIngestion(input);
      break;
    case "qa_create_practice_session":
      result = await createPracticeSession(input);
      break;
    default:
      throw new Error(`Unsupported tool: ${name}`);
  }

  return {
    content: [{ type: "text", text: result.text }],
    structuredContent: result.structured_content
  };
}

async function createFromConversation(input) {
  requireFields(input, ["source_system", "context_type", "instruction"]);

  if (!input.conversation_content && !input.conversation_summary) {
    throw new Error("conversation_content or conversation_summary is required.");
  }

  const data = await requestApi("/ingestions/external-conversation", {
    method: "POST",
    body: input
  });

  return {
    structured_content: data,
    text: [
      "已创建待确认知识沉淀。",
      `建议领域：${data.topic_suggestion?.domain_name ?? ""}`,
      `建议主题：${data.topic_suggestion?.topic_name ?? ""}`,
      `知识点预览：${(data.knowledge_points_preview ?? []).join("、")}`,
      `题目预览：${(data.questions_preview ?? []).length} 道`,
      `确认链接：${data.review_url}`
    ].join("\n")
  };
}

async function getReviewQueue(input) {
  const status = input.status || "pending";
  const limit = input.limit || 10;
  const envelope = await requestApiEnvelope(
    `/review-items?status=${encodeURIComponent(status)}&page_size=${encodeURIComponent(limit)}`,
    { method: "GET" }
  );

  return {
    structured_content: {
      items: envelope.data,
      pagination: envelope.pagination
    },
    text:
      envelope.data.length === 0
        ? "当前没有待确认项。"
        : envelope.data
            .map(
              (item, index) =>
                `${index + 1}. ${item.target_type} ${item.review_item_id}：${item.status}，${item.review_url}`
            )
            .join("\n")
  };
}

async function confirmIngestion(input) {
  requireFields(input, ["review_item_id"]);
  const data = await requestApi(
    `/review-items/${encodeURIComponent(input.review_item_id)}/confirm`,
    {
      method: "POST",
      body: {
        edits: input.edits,
        include_existing_attempts_in_mastery:
          input.include_existing_attempts_in_mastery ?? false
      }
    }
  );

  return {
    structured_content: data,
    text: `已确认待确认项 ${data.review_item_id}，当前状态：${data.status}。`
  };
}

async function createPracticeSession(input) {
  requireFields(input, ["target_type", "target_id"]);
  const data = await requestApi("/practice-sessions", {
    method: "POST",
    body: input
  });

  return {
    structured_content: data,
    text: [
      `已创建练习会话：${data.id}`,
      `目标：${data.target_type}:${data.target_id}`,
      `题目数：${(data.questions ?? []).length}`,
      ...(data.questions ?? [])
        .slice(0, 3)
        .map(
          (item, index) =>
            `${index + 1}. ${item.stem}（原因：${item.selection_reason}）`
        )
    ].join("\n")
  };
}

async function requestApi(path, options) {
  return (await requestApiEnvelope(path, options)).data;
}

async function requestApiEnvelope(path, options) {
  const response = await fetch(`${apiBaseUrl.replace(/\/+$/, "")}${path}`, {
    method: options.method,
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const payload = await response.json();

  if (!response.ok) {
    const error = payload?.error;
    throw new Error(
      error?.code && error?.message
        ? `${error.code}: ${error.message}`
        : "Knowledge QA API request failed."
    );
  }

  return payload;
}

function writeMessage(message) {
  const body = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
}

function ensureApiKey() {
  if (!apiKey) {
    throw new Error("KNOWLEDGE_QA_API_KEY is required.");
  }
}

function requireFields(input, fields) {
  const missing = fields.filter((field) => !input[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required field(s): ${missing.join(", ")}`);
  }
}

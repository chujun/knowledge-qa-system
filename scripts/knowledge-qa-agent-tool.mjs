#!/usr/bin/env node

const toolName = process.argv[2];
const args = parseArgs(process.argv.slice(3));

const apiBaseUrl =
  args.apiBaseUrl ||
  process.env.KNOWLEDGE_QA_API_BASE_URL ||
  "http://localhost:3000/api/v1";
const apiKey = args.apiKey || process.env.KNOWLEDGE_QA_API_KEY;

if (!toolName || toolName === "--help" || toolName === "-h" || args.help) {
  printHelp();
  process.exit(toolName ? 0 : 1);
}

if (!apiKey) {
  fail("KNOWLEDGE_QA_API_KEY is required.");
}

const input = parseInput(args.inputJson);

try {
  const result = await callTool(toolName, input, { apiBaseUrl, apiKey });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  fail(error instanceof Error ? error.message : "Unknown error");
}

async function callTool(name, input, config) {
  switch (name) {
    case "qa_create_from_conversation":
      return createFromConversation(input, config);
    case "qa_get_review_queue":
      return getReviewQueue(input, config);
    case "qa_confirm_ingestion":
      return confirmIngestion(input, config);
    case "qa_create_practice_session":
      return createPracticeSession(input, config);
    default:
      throw new Error(`Unsupported tool: ${name}`);
  }
}

async function createFromConversation(input, config) {
  requireFields(input, ["source_system", "context_type", "instruction"]);

  if (!input.conversation_content && !input.conversation_summary) {
    throw new Error("conversation_content or conversation_summary is required.");
  }

  const data = await requestApi(config, "/ingestions/external-conversation", {
    method: "POST",
    body: input
  });

  return {
    tool_name: "qa_create_from_conversation",
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

async function getReviewQueue(input, config) {
  const status = input.status || "pending";
  const limit = input.limit || 10;
  const envelope = await requestApiEnvelope(
    config,
    `/review-items?status=${encodeURIComponent(status)}&page_size=${encodeURIComponent(limit)}`,
    { method: "GET" }
  );

  return {
    tool_name: "qa_get_review_queue",
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

async function confirmIngestion(input, config) {
  requireFields(input, ["review_item_id"]);
  const data = await requestApi(
    config,
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
    tool_name: "qa_confirm_ingestion",
    structured_content: data,
    text: `已确认待确认项 ${data.review_item_id}，当前状态：${data.status}。`
  };
}

async function createPracticeSession(input, config) {
  requireFields(input, ["target_type", "target_id"]);
  const data = await requestApi(config, "/practice-sessions", {
    method: "POST",
    body: input
  });

  return {
    tool_name: "qa_create_practice_session",
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

async function requestApi(config, path, options) {
  return (await requestApiEnvelope(config, path, options)).data;
}

async function requestApiEnvelope(config, path, options) {
  const response = await fetch(`${config.apiBaseUrl.replace(/\/+$/, "")}${path}`, {
    method: options.method,
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey
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

function parseArgs(items) {
  const parsed = {};

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    if (item === "--help" || item === "-h") {
      parsed.help = true;
    } else if (item === "--input-json") {
      parsed.inputJson = items[++index];
    } else if (item === "--api-base-url") {
      parsed.apiBaseUrl = items[++index];
    } else if (item === "--api-key") {
      parsed.apiKey = items[++index];
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }

  return parsed;
}

function parseInput(value) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new Error("--input-json must be valid JSON.");
  }
}

function requireFields(input, fields) {
  const missing = fields.filter((field) => !input[field]);

  if (missing.length > 0) {
    throw new Error(`Missing required field(s): ${missing.join(", ")}`);
  }
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function printHelp() {
  process.stdout.write(`Knowledge QA Agent Tool CLI

Usage:
  node scripts/knowledge-qa-agent-tool.mjs <tool_name> --input-json '<json>'

Environment:
  KNOWLEDGE_QA_API_BASE_URL  Default: http://localhost:3000/api/v1
  KNOWLEDGE_QA_API_KEY       Required unless --api-key is provided

Tools:
  qa_create_from_conversation
  qa_get_review_queue
  qa_confirm_ingestion
  qa_create_practice_session

Example:
  node scripts/knowledge-qa-agent-tool.mjs qa_get_review_queue --input-json '{"status":"pending","limit":5}'
`);
}

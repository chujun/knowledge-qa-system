#!/usr/bin/env node

import { spawn } from "node:child_process";
import { once } from "node:events";

const apiKey = process.env.KNOWLEDGE_QA_API_KEY;

if (!apiKey) {
  throw new Error("KNOWLEDGE_QA_API_KEY is required.");
}

const child = spawn(process.execPath, ["scripts/knowledge-qa-mcp-stdio.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    KNOWLEDGE_QA_API_BASE_URL:
      process.env.KNOWLEDGE_QA_API_BASE_URL || "http://localhost:3000/api/v1"
  },
  stdio: ["pipe", "pipe", "pipe"]
});

let stdoutBuffer = Buffer.alloc(0);
let stderrText = "";
const responses = new Map();
const waiters = new Map();

child.stdout.on("data", (chunk) => {
  stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
  readMessages();
});

child.stderr.on("data", (chunk) => {
  stderrText += chunk.toString("utf8");
});

try {
  const initialize = await request("initialize", {});
  if (initialize.serverInfo?.name !== "knowledge-qa-mcp-server") {
    throw new Error("initialize response missing expected serverInfo.name");
  }

  const toolsList = await request("tools/list", {});
  if (!Array.isArray(toolsList.tools) || toolsList.tools.length === 0) {
    throw new Error("tools/list response missing tools");
  }

  const callResult = await request("tools/call", {
    name: "qa_get_review_queue",
    arguments: {
      status: "pending",
      limit: 3
    }
  });

  const contentText = callResult.content?.[0]?.text;
  if (typeof contentText !== "string" || contentText.length === 0) {
    throw new Error("tools/call response missing text content");
  }

  if (!callResult.structuredContent?.items) {
    throw new Error("tools/call response missing structuredContent.items");
  }

  process.stdout.write(
    [
      "MCP stdio call-check passed",
      `server: ${initialize.serverInfo.name}`,
      `tools: ${toolsList.tools.map((tool) => tool.name).join(", ")}`,
      `pending_items: ${callResult.structuredContent.items.length}`
    ].join("\n") + "\n"
  );
} finally {
  child.kill();
  child.stdin.destroy();
}

async function request(method, params) {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const message = {
    jsonrpc: "2.0",
    id,
    method,
    params
  };

  const waiter = waitForResponse(id);
  writeMessage(message);
  return waiter;
}

function writeMessage(message) {
  const body = JSON.stringify(message);
  child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
}

function readMessages() {
  while (true) {
    const headerEnd = stdoutBuffer.indexOf("\r\n\r\n");

    if (headerEnd === -1) {
      return;
    }

    const header = stdoutBuffer.slice(0, headerEnd).toString("utf8");
    const match = /Content-Length:\s*(\d+)/i.exec(header);

    if (!match) {
      throw new Error("Invalid MCP response: missing Content-Length");
    }

    const length = Number.parseInt(match[1], 10);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + length;

    if (stdoutBuffer.length < messageEnd) {
      return;
    }

    const raw = stdoutBuffer.slice(messageStart, messageEnd).toString("utf8");
    stdoutBuffer = stdoutBuffer.slice(messageEnd);
    const response = JSON.parse(raw);

    if (response.error) {
      rejectResponse(response.id, new Error(response.error.message));
    } else {
      resolveResponse(response.id, response.result);
    }
  }
}

function waitForResponse(id) {
  if (responses.has(id)) {
    return Promise.resolve(responses.get(id));
  }

  return Promise.race([
    new Promise((resolve, reject) => {
      waiters.set(id, { resolve, reject });
    }),
    once(child, "exit").then(([code]) => {
      throw new Error(`MCP stdio server exited early with code ${code}: ${stderrText}`);
    }),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("MCP stdio response timed out")), 30_000);
    })
  ]);
}

function resolveResponse(id, result) {
  const waiter = waiters.get(id);
  if (!waiter) {
    responses.set(id, result);
    return;
  }

  waiters.delete(id);
  waiter.resolve(result);
}

function rejectResponse(id, error) {
  const waiter = waiters.get(id);
  if (!waiter) {
    responses.set(id, Promise.reject(error));
    return;
  }

  waiters.delete(id);
  waiter.reject(error);
}

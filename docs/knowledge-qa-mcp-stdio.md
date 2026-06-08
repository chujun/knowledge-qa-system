# 知识问答 MCP Stdio Server

日期：2026-06-08

该脚本提供本地 stdio MCP Server 入口，面向 Codex、Claude Code 等本地 Agent。当前实现不依赖 MCP SDK，采用 MCP 常用的 `Content-Length` JSON-RPC 帧格式，后续可替换为官方 TypeScript SDK。

## 启动命令

```powershell
$env:KNOWLEDGE_QA_API_BASE_URL = "http://localhost:3000/api/v1"
$env:KNOWLEDGE_QA_API_KEY = "<your-api-key>"
npm run mcp:stdio
```

## 暴露工具

```text
qa_create_from_conversation
qa_get_review_queue
qa_confirm_ingestion
qa_create_practice_session
```

## Agent 客户端配置思路

将 MCP Server 命令配置为：

```text
node scripts/knowledge-qa-mcp-stdio.mjs
```

并在环境变量中设置：

```text
KNOWLEDGE_QA_API_BASE_URL
KNOWLEDGE_QA_API_KEY
```

## 冒烟测试

```powershell
node scripts/knowledge-qa-mcp-stdio.mjs --self-check
```

该测试只验证 `initialize` 和 `tools/list`，不调用业务 API，因此不需要启动 Next.js 服务。

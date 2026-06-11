# 知识问答 Agent Tool CLI

日期：2026-06-08

该 CLI 是真实 MCP Server 前的本地 Agent 调用入口。它使用与 MCP Tool 一致的工具名，通过 HTTP API 调用知识问答系统。

## 环境变量

```powershell
$env:KNOWLEDGE_QA_API_BASE_URL = "http://localhost:3000/api/v1"
$env:KNOWLEDGE_QA_API_KEY = "<your-api-key>"
```

## 调用方式

```powershell
npm run agent:tool -- qa_get_review_queue --input-json '{ "status": "pending", "limit": 5 }'
```

## 支持工具

```text
qa_create_from_conversation
qa_get_review_queue
qa_confirm_ingestion
qa_create_practice_session
```

## 示例：外部会话沉淀

```powershell
npm run agent:tool -- qa_create_from_conversation --input-json '{ "source_system": "Codex", "source_model_name": "MiniMax-M3", "context_type": "summary", "conversation_summary": "讨论了 GitHub Actions workflow 触发条件。", "instruction": "生成理解题和应用题", "target_domain_hint": "计算机" }'
```

Windows PowerShell 中如果 JSON 转义不稳定，建议使用文件输入：

```powershell
@{
  source_system = "Codex"
  source_model_name = "MiniMax-M3"
  context_type = "summary"
  conversation_summary = "讨论了 GitHub Actions workflow 触发条件。"
  instruction = "生成理解题和应用题"
  target_domain_hint = "计算机"
} | ConvertTo-Json -Compress | Set-Content -Encoding UTF8 .\tmp\agent-input.json

npm run agent:tool -- qa_create_from_conversation --input-json-file .\tmp\agent-input.json
```

输出包含：

```text
tool_name
structured_content
text
```

其中 `text` 适合直接展示在 Agent 聊天框，`structured_content` 供程序继续处理。

## Codex 调用建议

在 Codex 中可以把 `npm run agent:tool` 作为本地命令工具使用。关键约束：

- `source_system` 使用 `Codex`。
- `source_model_name` 使用当前用于生成知识内容或当前会话的模型名，例如 `MiniMax-M3`。
- 输出中的 `text` 可以直接回显给用户，必须保留 `确认链接`。
- 输出中的 `structured_content.review_url` 应指向 `/review/<review_item_id>`。

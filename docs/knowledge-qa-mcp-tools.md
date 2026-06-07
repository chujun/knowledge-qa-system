# 个人知识问答系统 MCP Tool 设计

日期：2026-06-06

关联文档：

```text
docs/knowledge-qa-api-draft.md
docs/knowledge-qa-domain-model.md
docs/TODO.md
```

## 阶段：MCP Tool 设计

阶段结论：

```text
MCP Server 是外部 AI Agent 的接入层，不承载核心业务逻辑。
MCP Tool 通过调用知识问答系统 HTTP API 完成外部会话沉淀、即时掌握、主题匹配、待确认查询和轻量确认。
```

已确认事项：

```text
API 是业务底座，MCP 是 Agent 适配层。
Agent 侧 MVP 只做轻量确认，不做复杂编辑。
Agent 返回主题建议、知识点列表、题目预览和确认/编辑链接。
外部 Agent 重复提交必须支持幂等。
```

待确认事项：

```text
MCP Server 使用 STDIO、本地 HTTP 还是两者都支持。
MCP Tool 调用后端 API 的认证方式。
Agent 能否提供完整会话、最近 N 轮、选中片段或摘要。
确认链接使用本地 Web URL 还是其他形式。
```

风险点：

```text
不同 Agent 可传递的上下文能力不一致，Tool 输入必须支持多种上下文形态。
外部会话可能包含隐私或密钥，MCP Server 应避免在日志中记录完整原文。
```

下一步动作：

```text
基于本文继续实现 MCP schema、Agent 本地模拟调用脚本和后端 API 映射。
```

## 1. MCP Server 职责

MCP Server 只负责：

```text
向外部 AI Agent 暴露可调用工具。
接收 Agent 传入的会话上下文、用户指令和目标主题。
执行参数校验、上下文裁剪和脱敏。
调用知识问答系统 HTTP API。
把 API 响应整理成适合聊天框展示的短结果。
返回确认/编辑链接。
```

MCP Server 不负责：

```text
知识点拆解业务逻辑
题目生成业务逻辑
质量校验业务逻辑
正式入库业务逻辑
掌握画像计算
审计事件业务规则
```

这些能力由后端 API 承载。

## 2. MCP 与 API 映射

| MCP Tool | 对应 API | 说明 |
|---|---|---|
| qa_create_from_conversation | POST /api/v1/ingestions/external-conversation | 从外部 Agent 会话生成待确认知识问答 |
| qa_create_instant_check | POST /api/v1/ingestions/instant | 即时掌握和小测 |
| qa_search_topics | GET /api/v1/topics, GET /api/v1/knowledge-points | 搜索已有领域、主题、知识点 |
| qa_attach_to_topic | PATCH/POST review item or ingestion API | 将候选沉淀挂到已有主题 |
| qa_get_review_queue | GET /api/v1/review-items | 查看待确认队列 |
| qa_confirm_ingestion | POST /api/v1/review-items/{id}/confirm | 轻量确认入库 |

## 3. 通用调用约定

认证：

```text
MCP Server 从环境变量读取知识问答系统 API Key。
调用后端 API 时使用 X-API-Key 或 Authorization Bearer。
```

环境变量建议：

```text
KNOWLEDGE_QA_API_BASE_URL=http://localhost:3000/api/v1
KNOWLEDGE_QA_API_KEY=<api_key>
KNOWLEDGE_QA_DEFAULT_USER_ID=<user_id>
```

幂等：

```text
所有创建类 Tool 都必须生成或接收 idempotency_key。
如果 Agent 提供 conversation_id，应优先使用 source_system + conversation_id + instruction hash 生成幂等键。
```

上下文限制：

```text
Tool 输入允许 conversation_content，但 MCP Server 应支持最大长度限制。
超过限制时，优先使用 conversation_summary。
如果两者都没有，返回上下文不足错误。
```

输出限制：

```text
Agent 侧只返回简短摘要。
题目预览默认最多 3 道。
知识点预览默认最多 8 个。
完整内容通过 review_url 到知识问答系统页面查看。
```

## 4. Tool：qa_create_from_conversation

用途：

```text
从 Codex、Claude Code、ChatGPT、Claude 等外部 AI Agent 当前会话中沉淀知识问答。
```

用户示例：

```text
把刚才关于 GitHub Actions workflow 的讨论录入知识问答系统，生成理解题和应用题。
```

输入 schema：

```json
{
  "type": "object",
  "required": ["source_system", "instruction"],
  "properties": {
    "source_system": {
      "type": "string",
      "description": "来源系统，例如 Codex、Claude Code、ChatGPT、Claude"
    },
    "conversation_id": {
      "type": "string",
      "description": "外部 Agent 会话 ID，可选"
    },
    "context_type": {
      "type": "string",
      "enum": ["full_conversation", "recent_turns", "selected_excerpt", "summary"],
      "description": "上下文类型"
    },
    "conversation_content": {
      "type": "string",
      "description": "会话原文或片段"
    },
    "conversation_summary": {
      "type": "string",
      "description": "会话摘要"
    },
    "instruction": {
      "type": "string",
      "description": "用户沉淀要求"
    },
    "target_topic_id": {
      "type": "string",
      "description": "希望挂载到的已有主题 ID，可选"
    },
    "target_domain_hint": {
      "type": "string",
      "description": "领域提示，例如 计算机、AI、摄影"
    },
    "direct_confirm": {
      "type": "boolean",
      "default": false,
      "description": "用户明确要求直接入库时为 true"
    },
    "idempotency_key": {
      "type": "string",
      "description": "幂等键，可选"
    }
  }
}
```

输出 schema：

```json
{
  "type": "object",
  "properties": {
    "ingestion_task_id": { "type": "string" },
    "status": { "type": "string" },
    "topic_suggestion": {
      "type": "object",
      "properties": {
        "domain_name": { "type": "string" },
        "topic_name": { "type": "string" }
      }
    },
    "knowledge_points_preview": {
      "type": "array",
      "items": { "type": "string" }
    },
    "questions_preview": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "stem": { "type": "string" },
          "cognitive_dimension": { "type": "string" },
          "difficulty_level": { "type": "integer" }
        }
      }
    },
    "review_url": { "type": "string" },
    "message": { "type": "string" }
  }
}
```

Agent 展示示例：

```text
已生成待确认知识沉淀：
- 建议领域：计算机
- 建议主题：GitHub Actions
- 知识点：workflow 文件结构、触发条件、jobs 和 steps
- 题目预览：3 道

你可以在这里查看和编辑：
http://localhost:3000/review/ing_003
```

## 5. Tool：qa_create_instant_check

用途：

```text
针对用户临时遇到的知识点，生成快速解释、小测题和可选沉淀内容。
```

用户示例：

```text
帮我快速掌握 GitHub Actions workflow 的基本写法，并出几道题测一下。
```

输入 schema：

```json
{
  "type": "object",
  "required": ["question_or_topic", "instruction"],
  "properties": {
    "question_or_topic": {
      "type": "string",
      "description": "用户想即时掌握的问题或知识点"
    },
    "instruction": {
      "type": "string",
      "description": "学习和出题要求"
    },
    "target_topic_id": {
      "type": "string",
      "description": "可选，挂到已有主题"
    },
    "question_count": {
      "type": "integer",
      "default": 3,
      "description": "小测题数量，默认 3"
    },
    "direct_confirm": {
      "type": "boolean",
      "default": false
    },
    "idempotency_key": {
      "type": "string"
    }
  }
}
```

输出 schema：

```json
{
  "type": "object",
  "properties": {
    "ingestion_task_id": { "type": "string" },
    "status": { "type": "string" },
    "explanation_preview": { "type": "string" },
    "temporary_questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question_id": { "type": "string" },
          "stem": { "type": "string" },
          "question_type": { "type": "string" }
        }
      }
    },
    "review_url": { "type": "string" },
    "message": { "type": "string" }
  }
}
```

## 6. Tool：qa_search_topics

用途：

```text
让外部 Agent 查询已有领域、主题、知识点，用于选择沉淀归属。
```

输入 schema：

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "搜索关键词"
    },
    "domain_id": {
      "type": "string",
      "description": "限定知识领域，可选"
    },
    "include_knowledge_points": {
      "type": "boolean",
      "default": true
    },
    "limit": {
      "type": "integer",
      "default": 10
    }
  }
}
```

输出 schema：

```json
{
  "type": "object",
  "properties": {
    "domains": {
      "type": "array",
      "items": { "type": "object" }
    },
    "topics": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "topic_id": { "type": "string" },
          "name": { "type": "string" },
          "domain_name": { "type": "string" }
        }
      }
    },
    "knowledge_points": {
      "type": "array",
      "items": { "type": "object" }
    }
  }
}
```

## 7. Tool：qa_attach_to_topic

用途：

```text
把一个待确认沉淀任务或待确认项挂载到已有主题。
```

输入 schema：

```json
{
  "type": "object",
  "required": ["target_topic_id"],
  "properties": {
    "ingestion_task_id": {
      "type": "string"
    },
    "review_item_id": {
      "type": "string"
    },
    "target_topic_id": {
      "type": "string"
    },
    "note": {
      "type": "string",
      "description": "用户备注"
    }
  }
}
```

输出 schema：

```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string" },
    "target_topic_id": { "type": "string" },
    "message": { "type": "string" },
    "review_url": { "type": "string" }
  }
}
```

## 8. Tool：qa_get_review_queue

用途：

```text
让 Agent 查看当前待确认沉淀队列，便于用户在聊天框里快速确认或跳转编辑。
```

输入 schema：

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "default": "pending"
    },
    "limit": {
      "type": "integer",
      "default": 10
    }
  }
}
```

输出 schema：

```json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "review_item_id": { "type": "string" },
          "target_type": { "type": "string" },
          "preview_title": { "type": "string" },
          "preview_summary": { "type": "string" },
          "created_at": { "type": "string" },
          "review_url": { "type": "string" }
        }
      }
    }
  }
}
```

## 9. Tool：qa_confirm_ingestion

用途：

```text
在 Agent 聊天框中轻量确认某个待确认项或沉淀任务。
```

输入 schema：

```json
{
  "type": "object",
  "required": ["review_item_id"],
  "properties": {
    "review_item_id": {
      "type": "string"
    },
    "target_topic_id": {
      "type": "string",
      "description": "可选，确认时指定归属主题"
    },
    "include_existing_attempts_in_mastery": {
      "type": "boolean",
      "default": false,
      "description": "临时题入库时是否补计入长期掌握画像"
    },
    "note": {
      "type": "string"
    },
    "idempotency_key": {
      "type": "string"
    }
  }
}
```

输出 schema：

```json
{
  "type": "object",
  "properties": {
    "review_item_id": { "type": "string" },
    "status": { "type": "string" },
    "confirmed_targets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "target_type": { "type": "string" },
          "target_id": { "type": "string" }
        }
      }
    },
    "message": { "type": "string" },
    "review_url": { "type": "string" }
  }
}
```

## 10. 错误响应

Tool 错误响应统一格式：

```json
{
  "error": {
    "code": "CONTEXT_REQUIRED",
    "message": "需要提供会话内容或会话摘要",
    "details": {}
  }
}
```

常见错误：

| 错误码 | 说明 |
|---|---|
| CONTEXT_REQUIRED | 缺少会话内容或摘要 |
| API_AUTH_FAILED | 调用后端 API 认证失败 |
| API_UNAVAILABLE | 后端 API 不可用 |
| IDEMPOTENCY_CONFLICT | 幂等键冲突 |
| REVIEW_ITEM_NOT_FOUND | 待确认项不存在 |
| TARGET_TOPIC_NOT_FOUND | 目标主题不存在 |
| BUSINESS_RULE_VIOLATION | 违反业务规则 |

## 11. Agent 侧交互示例

### 11.1 从 Codex 会话沉淀

用户：

```text
把刚才关于 GitHub Actions workflow 的讨论录入知识问答系统，生成理解题和应用题。
```

Agent 调用：

```json
{
  "tool": "qa_create_from_conversation",
  "arguments": {
    "source_system": "Codex",
    "context_type": "recent_turns",
    "conversation_summary": "讨论了 workflow 文件结构、触发条件、jobs 和 steps",
    "instruction": "生成理解题和应用题",
    "direct_confirm": false
  }
}
```

Agent 返回：

```text
已生成待确认知识沉淀：
- 建议领域：计算机
- 建议主题：GitHub Actions
- 知识点：workflow 文件结构、触发条件、jobs 和 steps
- 题目预览：3 道

打开确认和编辑：
http://localhost:3000/review/ing_003
```

### 11.2 即时掌握

用户：

```text
帮我快速掌握 GitHub Actions workflow 的基本写法，并出 3 道题测一下。
```

Agent 调用：

```json
{
  "tool": "qa_create_instant_check",
  "arguments": {
    "question_or_topic": "GitHub Actions workflow 的基本写法",
    "instruction": "先讲解，再生成 3 道小测题",
    "question_count": 3
  }
}
```

## 12. 安全和隐私规则

```text
MCP Server 不应默认记录完整 conversation_content。
日志中只记录 source_system、conversation_id、内容长度、摘要 hash。
API Key 不得出现在 Tool 输出中。
如果检测到疑似密钥、token、密码，应提示用户确认是否沉淀。
外部会话原文进入 SourceReference 前，应支持脱敏或摘要化策略。
```

## 13. 实现注意事项

```text
MCP Tool 的输出应尽量短，避免把完整题库塞回聊天框。
详细编辑放在知识问答系统页面。
所有创建类 Tool 需要支持 idempotency_key。
Tool schema 保持稳定，后端 API 可继续演进。
当后端 API 返回长流程状态时，Tool 返回 review_url 和 ingestion_task_id，允许用户稍后查看。
```

## 14. AI Agent MCP/Agent 调用能力验收标准

系统验收时必须证明个人知识问答系统不是只能通过 Web 页面或普通 HTTP API 使用，而是具备可被外部 AI Agent 调用的沉淀入口。

最低验收标准：

```text
1. 提供 MCP Tool schema 或等价 Agent Tool schema，且 schema 字段与本文定义一致。
2. 至少支持 qa_create_from_conversation，用于从外部会话沉淀知识问答内容。
3. Agent 调用时必须传入 source_system、instruction，以及 conversation_content 或 conversation_summary 之一。
4. Tool 调用必须经过 API Key 或等价本地认证校验。
5. Tool 调用必须创建或模拟创建 IngestionTask，并返回 ingestion_task_id。
6. Tool 返回必须包含 topic_suggestion、knowledge_points_preview、questions_preview、review_url。
7. review_url 必须指向知识问答系统的确认或编辑页面。
8. 重复提交同一 source_system、conversation_id、instruction 时必须支持幂等处理。
9. Agent 调用链路必须记录 ai_agent、model_name、model_version、prompt_version、latency_ms、status 等元数据，真实模型未接入时可使用 mock 值。
10. 失败时必须返回结构化错误，不得只返回自然语言失败描述。
```

MVP 第一阶段允许用本地模拟 Agent 调用脚本完成验收，但脚本必须复用同一份 Tool schema 或与 MCP Tool 输入输出结构保持一致。

## 15. 可模拟 Agent 调用验收场景

场景名称：

```text
Codex 会话沉淀 GitHub Actions 知识点
```

前置条件：

```text
知识问答系统本地服务已启动。
环境变量中已配置 KNOWLEDGE_QA_API_BASE_URL 和 KNOWLEDGE_QA_API_KEY。
系统中允许 mock AI provider 生成知识点、核心讲解、题目预览和质量校验结果。
```

模拟调用输入：

```json
{
  "tool": "qa_create_from_conversation",
  "arguments": {
    "source_system": "Codex",
    "conversation_id": "codex-local-20260607-001",
    "context_type": "summary",
    "conversation_summary": "用户和 Codex 讨论了 GitHub Actions workflow 的触发条件、jobs、steps、runner 和 secrets 使用方式。",
    "instruction": "围绕 GitHub Actions workflow 生成理解型和应用型问答，并进入待确认队列。",
    "target_domain_hint": "计算机",
    "direct_confirm": false,
    "idempotency_key": "Codex:codex-local-20260607-001:github-actions-workflow"
  }
}
```

期望输出：

```json
{
  "ingestion_task_id": "ing_mock_001",
  "status": "pending_review",
  "topic_suggestion": {
    "domain_name": "计算机",
    "topic_name": "GitHub Actions"
  },
  "knowledge_points_preview": [
    "workflow 触发条件",
    "jobs 与 steps 的关系",
    "runner 与 secrets 的基础使用"
  ],
  "questions_preview": [
    {
      "stem": "GitHub Actions 中 jobs 和 steps 的区别是什么？",
      "cognitive_dimension": "distinguish",
      "difficulty_level": 2
    }
  ],
  "review_url": "http://localhost:3000/review/ing_mock_001",
  "message": "已生成待确认知识沉淀，可在知识问答系统中查看和编辑。"
}
```

验收检查点：

```text
1. Agent 调用无需用户切换到知识问答系统页面即可发起。
2. 调用结果在聊天框中可读，但不会返回完整题库和完整会话原文。
3. 用户可以通过 review_url 进入知识问答系统查看详细内容并调整。
4. 第二次使用相同 idempotency_key 调用时返回同一 ingestion_task_id 或明确的幂等命中结果。
5. 系统记录本次调用的 source_system=Codex、ai_agent=Codex、model_name=chatgpt-5.5 或 mock、call_type=agent_ingestion。
```

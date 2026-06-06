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
基于本文继续生成 MVP 实施计划。
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


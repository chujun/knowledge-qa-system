# 个人知识问答系统 API 草案

日期：2026-06-06

关联文档：

```text
docs/knowledge-qa-business-model.md
docs/knowledge-qa-domain-model.md
docs/knowledge-qa-er-diagram.md
docs/TODO.md
```

## 阶段：接口设计

阶段结论：

```text
API 草案以业务工作流为中心，而不是直接暴露数据库表。
MVP API 覆盖知识结构、沉淀任务、待确认、题库版本、练习答题、掌握画像、错误集、来源审计和外部 Agent 接入。
```

已确认事项：

```text
API 是系统核心业务能力底座。
MCP Server 后续通过这些 API 适配外部 Agent。
所有外部沉淀类接口需要支持幂等。
答题记录必须绑定题目、答案、评分规则历史版本。
```

待确认事项：

```text
认证方式：本地单用户免登录、API Key、Bearer Token 或登录态。
MVP 是否直接接入真实 AI 模型，还是先使用 mock 生成器。
分页默认大小和最大大小。
确认链接的 URL 形式。
```

风险点：

```text
如果 API 过早暴露内部版本表结构，后续业务调整会困难。
外部 Agent 重复提交需要幂等处理，否则会产生重复沉淀任务。
```

下一步动作：

```text
基于本文继续设计 MCP Tool schema。
```

## 1. API 基本约定

Base URL：

```text
/api/v1
```

数据格式：

```text
Content-Type: application/json
Accept: application/json
```

时间格式：

```text
ISO 8601，例如 2026-06-06T22:00:00+08:00
```

ID 格式：

```text
uuid
```

## 2. 认证和授权

MVP 先定义接口契约，认证方式待确认。

候选方案：

```text
本地单用户免登录：适合最早期本机验证
API Key：适合 MCP Server 和外部 Agent 调用
Bearer Token：适合 Web + API 正式化
登录态 Cookie：适合 Web 页面
```

推荐 MVP：

```text
Web 本地页面：本地单用户或登录态
API/MCP 调用：API Key
```

请求头建议：

```text
Authorization: Bearer <token>
X-API-Key: <api_key>
```

## 3. 通用响应结构

成功响应：

```json
{
  "data": {},
  "meta": {
    "request_id": "req_123",
    "timestamp": "2026-06-06T22:00:00+08:00"
  }
}
```

列表响应：

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 100,
    "has_next": true
  },
  "meta": {
    "request_id": "req_123"
  }
}
```

错误响应：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数不合法",
    "details": [
      {
        "field": "name",
        "message": "名称不能为空"
      }
    ]
  },
  "meta": {
    "request_id": "req_123"
  }
}
```

## 4. 通用错误码

| HTTP 状态码 | 错误码 | 说明 |
|---|---|---|
| 400 | VALIDATION_ERROR | 请求参数不合法 |
| 401 | UNAUTHORIZED | 未认证 |
| 403 | FORBIDDEN | 无权限 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 状态冲突或来源冲突 |
| 422 | BUSINESS_RULE_VIOLATION | 违反业务规则 |
| 429 | RATE_LIMITED | 请求过多 |
| 500 | INTERNAL_ERROR | 系统内部错误 |
| 502 | MODEL_PROVIDER_ERROR | 模型服务错误 |
| 503 | SERVICE_UNAVAILABLE | 服务不可用 |

## 5. 分页、过滤、排序

分页参数：

```text
page
page_size
```

建议：

```text
默认 page_size = 20
最大 page_size = 100
```

过滤参数示例：

```text
status
domain_id
topic_id
knowledge_point_id
target_type
created_from
created_to
```

排序参数：

```text
sort=created_at:desc
sort=updated_at:desc
sort=name:asc
```

## 6. 幂等规则

外部 Agent 和沉淀类接口必须支持幂等。

请求头：

```text
Idempotency-Key: <unique-key>
```

适用接口：

```text
POST /api/v1/ingestions/topic
POST /api/v1/ingestions/instant
POST /api/v1/ingestions/external-conversation
POST /api/v1/review-items/{id}/confirm
POST /api/v1/review-items/{id}/reject
POST /api/v1/questions/{id}/attempts
```

规则：

```text
同一 user_id + idempotency_key 重复提交时，返回第一次创建的结果。
如果请求体不同但幂等键相同，返回 409 CONFLICT。
```

## 7. 知识领域 API

### 7.1 创建知识领域

```text
POST /api/v1/domains
```

请求：

```json
{
  "name": "AI",
  "description": "人工智能相关知识",
  "trust_policy": {
    "official_doc": "high",
    "external_ai_conversation": "medium"
  }
}
```

响应：

```json
{
  "data": {
    "id": "domain_001",
    "name": "AI",
    "status": "active",
    "created_at": "2026-06-06T22:00:00+08:00"
  }
}
```

### 7.2 查询知识领域列表

```text
GET /api/v1/domains?status=active
```

### 7.3 更新知识领域

```text
PATCH /api/v1/domains/{domain_id}
```

### 7.4 归档知识领域

```text
POST /api/v1/domains/{domain_id}/archive
```

## 8. 知识主题 API

### 8.1 创建知识主题

```text
POST /api/v1/topics
```

请求：

```json
{
  "domain_id": "domain_001",
  "name": "GitHub Actions",
  "description": "学习 GitHub Actions 自动化工作流"
}
```

### 8.2 查询主题列表

```text
GET /api/v1/topics?domain_id=domain_001&status=confirmed
```

### 8.3 获取主题详情

```text
GET /api/v1/topics/{topic_id}
```

### 8.4 更新主题

```text
PATCH /api/v1/topics/{topic_id}
```

## 9. 知识点 API

### 9.1 创建知识点

```text
POST /api/v1/knowledge-points
```

请求：

```json
{
  "domain_id": "domain_001",
  "topic_id": "topic_001",
  "knowledge_type_id": "type_operation",
  "name": "workflow 触发条件",
  "description": "理解 GitHub Actions workflow 的触发方式",
  "complexity_level": "medium",
  "suggested_difficulty": 3
}
```

### 9.2 查询知识点列表

```text
GET /api/v1/knowledge-points?topic_id=topic_001&status=confirmed
```

### 9.3 获取知识点详情

```text
GET /api/v1/knowledge-points/{knowledge_point_id}
```

## 10. 知识类型 API

### 10.1 查询知识类型

```text
GET /api/v1/knowledge-types
```

响应：

```json
{
  "data": [
    {
      "id": "type_concept",
      "code": "concept",
      "name": "概念类",
      "explanation_template": ["定义", "核心特征", "适用场景", "易混概念", "示例"]
    }
  ]
}
```

## 11. 沉淀任务 API

### 11.1 主题学习沉淀

```text
POST /api/v1/ingestions/topic
```

请求：

```json
{
  "topic_name": "GitHub Actions",
  "domain_hint": "计算机",
  "instruction": "帮我系统学习 GitHub Actions，先拆知识结构，再生成问答",
  "direct_confirm": false
}
```

响应：

```json
{
  "data": {
    "ingestion_task_id": "ing_001",
    "status": "pending_review",
    "suggested_domain": {
      "name": "计算机"
    },
    "suggested_topic": {
      "name": "GitHub Actions"
    },
    "knowledge_points_preview": [
      {
        "name": "workflow 基本结构",
        "knowledge_type": "操作类",
        "complexity_level": "medium"
      }
    ],
    "review_url": "http://localhost:3000/review/ing_001"
  }
}
```

### 11.2 即时掌握

```text
POST /api/v1/ingestions/instant
```

请求：

```json
{
  "question_or_topic": "GitHub Actions workflow 怎么写？",
  "instruction": "先解释基本用法，再出 2-3 道小测题",
  "target_topic_id": null,
  "direct_confirm": false
}
```

响应：

```json
{
  "data": {
    "ingestion_task_id": "ing_002",
    "status": "generated",
    "explanation_preview": "workflow 是 GitHub Actions 的自动化流程定义...",
    "temporary_questions": [
      {
        "id": "q_temp_001",
        "stem": "workflow 文件通常放在哪个目录？",
        "question_type": "subjective"
      }
    ],
    "review_url": "http://localhost:3000/review/ing_002"
  }
}
```

### 11.3 外部会话沉淀

```text
POST /api/v1/ingestions/external-conversation
```

请求：

```json
{
  "source_system": "Codex",
  "conversation_id": "codex_thread_001",
  "context_type": "recent_turns",
  "conversation_content": "用户和 Agent 关于 GitHub Actions workflow 的讨论...",
  "conversation_summary": "讨论了 workflow 文件结构、触发条件、jobs 和 steps",
  "instruction": "把这段会话整理成知识问答，生成理解题和应用题",
  "target_topic_id": null,
  "direct_confirm": false
}
```

响应：

```json
{
  "data": {
    "ingestion_task_id": "ing_003",
    "status": "pending_review",
    "topic_suggestion": {
      "name": "GitHub Actions",
      "domain_name": "计算机"
    },
    "knowledge_points_preview": [
      "workflow 文件结构",
      "触发条件",
      "jobs 和 steps"
    ],
    "questions_preview": [
      {
        "stem": "GitHub Actions 的 workflow 文件通常放在哪里？",
        "cognitive_dimension": "understanding",
        "difficulty_level": 2
      }
    ],
    "review_url": "http://localhost:3000/review/ing_003"
  }
}
```

### 11.4 获取沉淀任务详情

```text
GET /api/v1/ingestions/{ingestion_task_id}
```

## 12. 待确认队列 API

### 12.1 查询待确认项

```text
GET /api/v1/review-items?status=pending&page=1&page_size=20
```

### 12.2 获取待确认项详情

```text
GET /api/v1/review-items/{review_item_id}
```

### 12.3 确认待确认项

```text
POST /api/v1/review-items/{review_item_id}/confirm
```

请求：

```json
{
  "edits": {
    "target_topic_id": "topic_001",
    "title": "GitHub Actions workflow 基础"
  },
  "include_existing_attempts_in_mastery": false
}
```

响应：

```json
{
  "data": {
    "review_item_id": "rev_001",
    "status": "confirmed",
    "confirmed_targets": [
      {
        "target_type": "question",
        "target_id": "q_001"
      }
    ]
  }
}
```

### 12.4 拒绝待确认项

```text
POST /api/v1/review-items/{review_item_id}/reject
```

请求：

```json
{
  "reason": "题目质量不够"
}
```

## 13. 题目和版本 API

### 13.1 查询题目

```text
GET /api/v1/questions?knowledge_point_id=kp_001&status=confirmed
```

### 13.2 获取题目详情

```text
GET /api/v1/questions/{question_id}
```

响应包含当前版本：

```json
{
  "data": {
    "id": "q_001",
    "question_type": "subjective",
    "cognitive_dimension": "application",
    "difficulty_level": 3,
    "status": "confirmed",
    "current_version": {
      "id": "qv_001",
      "stem": "如果只想在 main 分支 push 时触发 workflow，应该怎么配置？"
    },
    "current_answer_version": {
      "id": "av_001",
      "answer_content": "应在 on.push.branches 中配置 main..."
    },
    "current_rubric_version": {
      "id": "rv_001",
      "scoring_points": []
    }
  }
}
```

### 13.3 归档题目

```text
POST /api/v1/questions/{question_id}/archive
```

### 13.4 创建题目新版本

```text
POST /api/v1/questions/{question_id}/versions
```

### 13.5 创建答案新版本

```text
POST /api/v1/questions/{question_id}/answer-versions
```

### 13.6 创建评分规则新版本

```text
POST /api/v1/questions/{question_id}/rubric-versions
```

## 14. 核心讲解 API

### 14.1 获取知识点核心讲解

```text
GET /api/v1/knowledge-points/{knowledge_point_id}/explanations
```

### 14.2 创建或更新核心讲解版本

```text
POST /api/v1/core-explanations/{core_explanation_id}/versions
```

请求：

```json
{
  "content": {
    "目标": "理解 workflow 触发条件",
    "前置条件": "了解 GitHub 仓库和 YAML",
    "操作步骤": []
  },
  "source_reference_id": "src_001"
}
```

## 15. 质量校验 API

### 15.1 对题目触发质量校验

```text
POST /api/v1/quality-checks
```

请求：

```json
{
  "target_type": "question",
  "target_id": "q_001",
  "check_mode": "rule_and_ai",
  "auto_fix": true,
  "max_retry": 3
}
```

响应：

```json
{
  "data": {
    "quality_check_id": "qc_001",
    "result": "warning",
    "overall_score": 82,
    "issues": [
      {
        "metric": "clarity",
        "score": 78,
        "message": "题干条件略少"
      }
    ]
  }
}
```

### 15.2 查询质量校验记录

```text
GET /api/v1/quality-checks?target_type=question&target_id=q_001
```

## 16. 练习和答题 API

### 16.1 创建练习会话

```text
POST /api/v1/practice-sessions
```

请求：

```json
{
  "session_type": "topic",
  "target_type": "topic",
  "target_id": "topic_001",
  "strategy": {
    "prefer_weak_dimensions": true,
    "include_error_set": true,
    "question_count": 5
  }
}
```

响应：

```json
{
  "data": {
    "practice_session_id": "ps_001",
    "status": "created",
    "questions": [
      {
        "question_id": "q_001",
        "question_version_id": "qv_001",
        "stem": "workflow 文件通常放在哪里？"
      }
    ]
  }
}
```

### 16.2 提交答题

```text
POST /api/v1/questions/{question_id}/attempts
```

请求：

```json
{
  "practice_session_id": "ps_001",
  "question_version_id": "qv_001",
  "answer_version_id": "av_001",
  "rubric_version_id": "rv_001",
  "user_answer": "放在 .github/workflows 目录下",
  "affects_mastery": true
}
```

响应：

```json
{
  "data": {
    "answer_attempt_id": "att_001",
    "ai_score": 85,
    "ai_level": "基本掌握",
    "ai_diagnosis_tags": ["理解较好"],
    "feedback": {
      "missing_points": [],
      "core_explanation": "workflow 文件必须位于仓库的 .github/workflows 目录...",
      "next_question_suggestion": "如果有多个 workflow 文件，它们如何被触发？"
    }
  }
}
```

### 16.3 确认或修正 AI 评分

```text
POST /api/v1/answer-attempts/{answer_attempt_id}/confirm-score
```

请求：

```json
{
  "user_confirmed_score": 80,
  "user_confirmed_level": "基本掌握",
  "score_diff_reason": "用户表达不完整",
  "affects_mastery": true
}
```

## 17. 掌握画像 API

### 17.1 查询掌握画像

```text
GET /api/v1/mastery-profiles?target_type=topic&target_id=topic_001
```

响应：

```json
{
  "data": {
    "target_type": "topic",
    "target_id": "topic_001",
    "understanding_score": 82,
    "differentiation_score": 70,
    "application_score": 65,
    "analysis_score": 58,
    "evaluation_score": 52,
    "overall_score": 66,
    "overall_level": "模糊",
    "weak_dimensions": ["analysis", "evaluation"],
    "next_practice_suggestion": {
      "strategy": "优先练习分析题和评价题"
    }
  }
}
```

### 17.2 触发掌握画像重算

```text
POST /api/v1/mastery-profiles/recalculate
```

请求：

```json
{
  "target_type": "knowledge_point",
  "target_id": "kp_001"
}
```

## 18. 错误集 API

### 18.1 查询错误集

```text
GET /api/v1/error-sets?topic_id=topic_001&status=active
```

### 18.2 标记错误项已解决

```text
POST /api/v1/error-sets/{error_set_id}/resolve
```

## 19. 来源引用 API

### 19.1 查询来源引用

```text
GET /api/v1/source-references?source_type=external_conversation
```

### 19.2 获取来源详情

```text
GET /api/v1/source-references/{source_reference_id}
```

### 19.3 更新来源可信度

```text
PATCH /api/v1/source-references/{source_reference_id}
```

请求：

```json
{
  "trust_level": "high"
}
```

## 20. 审计 API

### 20.1 查询审计事件

```text
GET /api/v1/audit-events?target_type=question&target_id=q_001
```

### 20.2 查询生成记录

```text
GET /api/v1/generation-records?target_type=question&target_id=q_001
```

### 20.3 查询模型调用记录

```text
GET /api/v1/model-call-records?call_type=generate
```

## 21. 健康检查 API

### 21.1 服务健康检查

```text
GET /api/v1/health
```

响应：

```json
{
  "data": {
    "status": "ok",
    "database": "ok",
    "model_provider": "unknown",
    "timestamp": "2026-06-06T22:00:00+08:00"
  }
}
```

## 22. API 设计原则

```text
业务 API 不直接暴露内部表名。
所有创建类接口返回业务 ID 和当前状态。
长流程接口返回 ingestion_task_id 或 quality_check_id，便于后续查询。
外部 Agent 调用必须使用幂等键。
待确认是正式入库前的统一闸门。
答题接口必须显式传入版本 ID，保证历史可追溯。
```


# 个人知识问答系统可观测性设计

日期：2026-06-07

关联文档：

```text
docs/knowledge-qa-architecture.md
docs/knowledge-qa-security.md
docs/knowledge-qa-generation-quality.md
docs/TODO.md
```

## 阶段：可观测性设计

阶段结论：

```text
MVP 可观测性以本地可排查、业务可审计、模型可分析为目标。
系统需要同时记录应用日志、访问日志、错误日志、业务事件日志、审计日志和 AI 调用日志。
指标重点覆盖模型调用耗时、token、成本、题目生成成功率、质量校验通过率、自动修正次数、用户确认率和 AI 评分被修正率。
```

已确认事项：

```text
第一版开始记录 token、耗时和模型调用成本。
审计事件从 MVP 开始保留。
外部 Agent/MCP 调用能力是系统验收标准的一部分，需要可观测性支持。
日志不得记录完整敏感内容。
```

待确认事项：

```text
日志落地方式：本地文件、SQLite 表、控制台输出或组合。
指标是否第一版就提供 Web 页面展示。
是否需要日志保留天数和自动清理策略。
```

风险点：

```text
记录太少会影响模型质量追踪和问题排查。
记录太多原文会带来隐私和存储风险。
SQLite 下日志和审计数据增长较快，需要后续归档策略。
```

下一步动作：

```text
进入 MVP 实施计划，生成 docs/knowledge-qa-mvp-plan.md。
```

## 1. 日志类型

系统需要六类日志或记录：

```text
应用日志
访问日志
错误日志
业务事件日志
审计日志
AI 调用日志
```

推荐落地：

```text
应用日志、访问日志、错误日志：本地日志文件 + 控制台。
业务事件、审计日志、AI 调用日志：SQLite 表。
```

## 2. 应用日志

用途：

```text
记录系统启动、配置加载、模块初始化、任务状态变化、关键运行信息。
```

字段：

```text
timestamp
level
request_id
module
message
metadata
```

示例：

```json
{
  "timestamp": "2026-06-07T12:00:00+08:00",
  "level": "info",
  "module": "ingestion",
  "message": "Ingestion task created",
  "metadata": {
    "ingestion_task_id": "ing_001",
    "ingestion_type": "external_conversation"
  }
}
```

## 3. 访问日志

用途：

```text
记录 HTTP API 和 Web 请求。
```

字段：

```text
timestamp
request_id
method
path
status_code
latency_ms
user_id
client_type
user_agent
```

安全要求：

```text
不记录 API Key。
不记录完整请求体。
对外部会话、用户答案、模型响应做摘要或 hash。
```

## 4. 错误日志

用途：

```text
记录系统异常、模型调用失败、质量校验失败、业务规则冲突。
```

字段：

```text
timestamp
request_id
level
module
error_code
error_message
stack_trace
target_type
target_id
retryable
```

规则：

```text
错误消息不得包含密钥。
stack_trace 仅本地开发或受控环境显示。
用户可见错误使用统一错误响应，不直接暴露内部异常。
```

## 5. 业务事件日志

用途：

```text
记录业务流程的关键状态变化，支撑问题排查和流程分析。
```

事件类型：

```text
ingestion_submitted
ingestion_generated
ingestion_quality_checked
review_item_created
review_item_confirmed
review_item_rejected
question_confirmed
practice_session_started
answer_attempt_created
score_confirmed
mastery_recalculated
error_set_created
```

字段：

```text
event_id
event_type
user_id
target_type
target_id
request_id
metadata
created_at
```

## 6. 审计日志

用途：

```text
记录敏感和重要业务操作，保证可追溯。
```

必须审计：

```text
外部 Agent 提交沉淀任务
用户确认正式入库
用户直接入库
用户编辑题目/答案/评分规则
用户修正 AI 评分
来源冲突处理
API Key 生成或轮换
质量校验人工放行
删除或脱敏来源内容
```

字段：

```text
id
user_id
event_type
target_type
target_id
actor_type
actor_id
before_snapshot
after_snapshot
metadata
created_at
```

脱敏要求：

```text
before_snapshot 和 after_snapshot 不默认保存完整原文。
保存关键字段、摘要、hash 和状态变化即可。
```

## 7. AI 调用日志

用途：

```text
分析模型质量、性能、成本和失败原因。
```

落地对象：

```text
ModelCallRecord
GenerationRecord
QualityCheckRecord
```

字段：

```text
call_type
ai_agent
model_name
model_version
prompt_version
request_summary
response_summary
params
input_tokens
output_tokens
latency_ms
cost
status
error_message
created_at
```

MVP 默认：

```text
记录 request_summary 和 response_summary。
不默认保存完整 prompt 和完整 response。
记录 token、耗时、成本。
```

## 8. 模型调用耗时指标

指标：

```text
model_call_latency_ms
model_call_latency_p50
model_call_latency_p95
model_call_timeout_count
```

维度：

```text
call_type
model_name
model_version
ai_agent
prompt_version
status
```

用途：

```text
识别哪个模型或提示词版本响应慢。
判断同步执行是否影响用户体验。
评估是否需要后台队列。
```

## 9. 模型调用 token 和成本指标

指标：

```text
model_input_tokens_total
model_output_tokens_total
model_cost_total
model_cost_by_call_type
average_cost_per_question_generation
average_cost_per_quality_check
```

用途：

```text
评估出题、评分、质检的成本。
对比不同模型和 Agent 的成本效率。
为后续模型选择提供依据。
```

## 10. 题目生成成功率指标

指标：

```text
question_generation_attempt_count
question_generation_success_count
question_generation_failed_count
question_generation_success_rate
```

维度：

```text
knowledge_type
complexity_level
cognitive_dimension
model_name
ai_agent
prompt_version
```

用途：

```text
判断哪些知识类型更难生成题目。
判断哪个模型在某类题目上更稳定。
```

## 11. 质量校验通过率指标

指标：

```text
quality_check_pass_count
quality_check_warning_count
quality_check_fail_count
quality_check_pass_rate
quality_check_average_score
```

维度：

```text
target_type
knowledge_type
cognitive_dimension
model_name
check_model_name
prompt_version
```

用途：

```text
衡量题目质量。
识别低质量生成模式。
分析生成模型和校验模型差异。
```

## 12. 自动修正次数指标

指标：

```text
auto_fix_attempt_count
auto_fix_success_count
auto_fix_failed_manual_required_count
average_auto_fix_retry_count
```

用途：

```text
判断质量校验是否过严。
发现模型反复修不好的知识类型或题型。
评估是否需要用户提前补充来源材料。
```

## 13. 用户确认率指标

指标：

```text
review_item_created_count
review_item_confirmed_count
review_item_rejected_count
review_item_edited_count
review_item_confirm_rate
review_item_edit_rate
```

维度：

```text
ingestion_type
source_system
ai_agent
model_name
knowledge_type
```

用途：

```text
评估生成内容是否符合用户预期。
评估不同 Agent 和模型的沉淀质量。
```

## 14. AI 评分被用户修正率指标

指标：

```text
ai_score_count
user_score_confirm_count
user_score_corrected_count
score_correction_rate
average_score_delta
```

维度：

```text
question_type
cognitive_dimension
difficulty_level
model_name
prompt_version
score_diff_reason
```

用途：

```text
评估 AI 评分可靠性。
发现评分规则或标准答案问题。
分析用户自评和 AI 评分差异。
```

## 15. 健康检查接口

API：

```text
GET /api/v1/health
```

返回：

```json
{
  "data": {
    "status": "ok",
    "database": "ok",
    "model_provider": "unknown",
    "version": "0.1.0",
    "timestamp": "2026-06-07T12:00:00+08:00"
  }
}
```

检查项：

```text
服务进程是否正常
SQLite 是否可读写
配置是否加载
模型 provider 是否配置
API Key 是否启用
```

## 16. 常见问题排查路径

### 16.1 外部 Agent 沉淀失败

检查：

```text
MCP Tool 输入是否有 conversation_content 或 conversation_summary。
API Key 是否正确。
Idempotency-Key 是否冲突。
ingestion_task 状态和错误信息。
ModelCallRecord 是否失败。
```

### 16.2 题目生成质量低

检查：

```text
knowledge_type 和 complexity_level 是否正确。
source_reference 是否充分。
GenerationRecord 的 model_name 和 prompt_version。
QualityCheckRecord 的 issues 和 suggestions。
auto_fix retry_count 是否过高。
```

### 16.3 AI 评分不准

检查：

```text
AnswerVersion 是否完整。
ScoringRubricVersion 是否明确。
用户修正原因 score_diff_reason。
同类题目的 score_correction_rate。
模型和提示词版本。
```

### 16.4 掌握画像不符合预期

检查：

```text
AnswerAttempt.affects_mastery 是否正确。
临时题是否被错误计入。
用户确认评分是否存在。
MasteryProfile calculated_at 是否更新。
错误集状态是否影响画像。
```

### 16.5 本地服务无法访问

检查：

```text
服务端口是否启动。
监听地址是 127.0.0.1 还是 0.0.0.0。
SQLite 文件路径是否可写。
环境变量是否加载。
健康检查接口是否正常。
```

## 17. 可观测性验收点

```text
系统能记录 HTTP 访问日志。
系统能记录错误日志。
系统能记录业务事件。
系统能记录审计事件。
系统能记录模型调用 token、耗时和成本。
题目生成成功率可从记录中计算。
质量校验通过率可从记录中计算。
自动修正次数可从记录中计算。
用户确认率可从记录中计算。
AI 评分被用户修正率可从记录中计算。
健康检查接口可返回服务和数据库状态。
日志中不出现 API Key、模型 API Key、完整会话原文和完整用户答案。
```


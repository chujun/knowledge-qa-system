# 个人知识问答系统领域模型

日期：2026-06-06

关联文档：

```text
docs/knowledge-qa-business-model.md
docs/knowledge-qa-design-dev-flow-check.md
docs/TODO.md
```

## 阶段：领域建模细化

阶段结论：

```text
领域模型按“知识结构、沉淀入库、题库版本、练习评分、掌握画像、质量校验、来源溯源、外部接入”拆分。
MVP 推荐新增 IngestionTask、ReviewItem、PracticeSession、ModelCallRecord 四个对象，以承载关键流程和审计边界。
```

已确认事项：

```text
核心知识层级为 User -> KnowledgeDomain -> KnowledgeTopic -> KnowledgePoint -> Question。
题目、答案、评分规则、核心讲解都需要版本化。
待确认内容未正式入库前，不进入正式题库，不参与长期掌握画像。
掌握画像支持知识领域、知识主题、知识点三个层级。
外部 Agent 通过 API/MCP 提交沉淀任务，系统返回轻量确认信息和编辑链接。
```

待确认事项：

```text
PracticeSession 是否第一版就落库，还是先只记录 AnswerAttempt。
ModelCallRecord 是否记录完整 prompt 和 response，还是只记录摘要、token、耗时、模型参数。
掌握画像是答题后实时重算，还是异步任务重算。
```

风险点：

```text
版本化对象较多，必须保证答题记录绑定历史版本，否则历史评分无法审计。
AI 生成、质检、自动修正是长流程，需要任务对象承载部分失败和人工处理状态。
```

下一步动作：

```text
基于本文档生成 ER 图和表结构草案。
```

## 1. 领域边界

系统领域边界包括：

```text
个人知识结构管理
AI 辅助知识沉淀
题目、答案、讲解和评分规则版本管理
题目质量校验和自动修正
答题、评分和用户修正
掌握画像和错误集复盘
来源、模型、Agent、提示词版本溯源
外部 Agent API/MCP 接入
```

MVP 不包含：

```text
团队共享知识库
学习目标和提醒计划
完整文档导入
浏览器插件
模型 A/B 评测平台
复杂审计报表
```

## 2. 核心子域

| 子域 | 职责 | 关键对象 |
|---|---|---|
| 知识结构子域 | 管理领域、主题、知识点、知识类型 | KnowledgeDomain, KnowledgeTopic, KnowledgePoint, KnowledgeType |
| 沉淀入库子域 | 承接主题学习、即时掌握、外部会话沉淀 | IngestionTask, ReviewItem |
| 题库版本子域 | 管理题目、题目版本、答案版本、评分规则版本 | Question, QuestionVersion, AnswerVersion, ScoringRubricVersion |
| 核心讲解子域 | 管理知识点通用讲解和题目补充讲解 | CoreExplanation, CoreExplanationVersion |
| 质量校验子域 | 管理规则校验、AI 校验、自动修正和人工处理 | QualityCheckRecord |
| 练习评分子域 | 管理练习会话、答题记录、AI 评分、用户修正 | PracticeSession, AnswerAttempt |
| 掌握画像子域 | 计算领域、主题、知识点掌握情况 | MasteryProfile, ErrorSet |
| 溯源审计子域 | 记录来源、生成、模型调用、审计事件 | SourceReference, GenerationRecord, ModelCallRecord, AuditEvent |
| 外部接入子域 | 对接 API 和 MCP Tool | API Contract, MCP Tool |

## 3. 聚合根建议

| 聚合根 | 聚合内实体 | 说明 |
|---|---|---|
| KnowledgeDomain | KnowledgeTopic 引用，不强聚合 | 领域是主题归档和领域级画像的根 |
| KnowledgeTopic | KnowledgePoint 引用，不强聚合 | 主题承载大纲、结构确认和主题级画像 |
| KnowledgePoint | CoreExplanation、Question 引用 | 知识点是题目生成和知识讲解的核心上下文 |
| IngestionTask | ReviewItem | 沉淀任务承载生成、质检、待确认流程 |
| Question | QuestionVersion、AnswerVersion、ScoringRubricVersion | 题目聚合保证版本关系一致 |
| PracticeSession | AnswerAttempt | 练习会话承载一组答题和当次反馈 |
| MasteryProfile | 无强聚合实体 | 掌握画像是派生聚合，挂载到领域、主题或知识点 |

说明：

```text
关系型数据库实现时可以通过外键关联，不必在代码层强制大聚合一次加载。
聚合根用于定义业务一致性边界和事务边界。
```

## 4. 新增对象建议

### 4.1 IngestionTask 沉淀任务

用于承载主题学习、即时掌握、外部会话沉淀的长流程。

建议字段：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 沉淀任务 ID | 唯一标识 |
| user_id | 用户 ID | 所属用户 |
| ingestion_type | 沉淀类型 | topic_learning / instant_mastery / external_conversation |
| source_reference_id | 来源引用 ID | 来源内容 |
| requested_by | 请求来源 | user / ai_agent / system |
| instruction | 用户指令 | 用户提出的沉淀要求 |
| status | 状态 | submitted / extracting / generated / quality_checking / pending_review / confirmed / rejected / failed |
| idempotency_key | 幂等键 | 防止外部 Agent 重复提交 |
| error_message | 错误信息 | 失败原因 |
| created_at | 创建时间 | 创建时间 |
| updated_at | 更新时间 | 更新时间 |

### 4.2 ReviewItem 待确认项

用于把生成内容放入统一待确认队列。

建议字段：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 待确认项 ID | 唯一标识 |
| user_id | 用户 ID | 所属用户 |
| ingestion_task_id | 沉淀任务 ID | 来源任务 |
| target_type | 确认对象类型 | domain / topic / knowledge_point / question / explanation / conflict |
| target_id | 确认对象 ID | 待确认对象 |
| preview | 预览内容 | Agent 或页面展示摘要 |
| status | 状态 | pending / confirmed / rejected / edited / archived |
| confirmed_at | 确认时间 | 用户确认时间 |
| created_at | 创建时间 | 创建时间 |
| updated_at | 更新时间 | 更新时间 |

### 4.3 PracticeSession 练习会话

用于承载一次主题练习、薄弱练习、错误集复盘或即时小测。

建议字段：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 练习会话 ID | 唯一标识 |
| user_id | 用户 ID | 所属用户 |
| session_type | 会话类型 | topic / weak_dimension / error_set / instant_check |
| target_type | 练习对象类型 | domain / topic / knowledge_point / error_set |
| target_id | 练习对象 ID | 练习目标 |
| status | 状态 | created / in_progress / completed / reviewed |
| started_at | 开始时间 | 开始答题时间 |
| completed_at | 完成时间 | 完成时间 |
| created_at | 创建时间 | 创建时间 |
| updated_at | 更新时间 | 更新时间 |

### 4.4 ModelCallRecord 模型调用记录

用于记录每次 AI 生成、评分、校验、修正调用。

建议字段：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 模型调用记录 ID | 唯一标识 |
| user_id | 用户 ID | 所属用户 |
| call_type | 调用类型 | generate / score / quality_check / fix / summarize |
| ai_agent | AI Agent | Codex / Claude Code / ChatGPT / 自建 Agent |
| model_name | 模型名称 | 模型名称 |
| model_version | 模型版本 | 模型版本 |
| prompt_version | 提示词版本 | 提示词版本 |
| request_summary | 请求摘要 | 脱敏后的请求摘要 |
| response_summary | 响应摘要 | 脱敏后的响应摘要 |
| params | 调用参数 | temperature、top_p 等 |
| input_tokens | 输入 token | 可选 |
| output_tokens | 输出 token | 可选 |
| latency_ms | 耗时毫秒 | 可选 |
| cost | 成本 | 可选 |
| status | 状态 | success / failed |
| error_message | 错误信息 | 失败原因 |
| created_at | 创建时间 | 创建时间 |
| updated_at | 更新时间 | 更新时间 |

## 5. 实体关系

```text
User 1 -> N KnowledgeDomain
KnowledgeDomain 1 -> N KnowledgeTopic
KnowledgeTopic 1 -> N KnowledgePoint
KnowledgePoint 1 -> N Question
KnowledgePoint 1 -> N CoreExplanation
Question 1 -> N QuestionVersion
Question 1 -> N AnswerVersion
Question 1 -> N ScoringRubricVersion
Question 1 -> N AnswerAttempt
PracticeSession 1 -> N AnswerAttempt
IngestionTask 1 -> N ReviewItem
SourceReference 1 -> N GenerationRecord
GenerationRecord 1 -> N QualityCheckRecord
AnswerAttempt N -> 1 QuestionVersion
AnswerAttempt N -> 1 AnswerVersion
AnswerAttempt N -> 1 ScoringRubricVersion
MasteryProfile N -> 1 target(domain/topic/knowledge_point)
ErrorSet N -> 1 AnswerAttempt
AuditEvent N -> 1 target(any audited object)
```

## 6. 版本关系

题目版本关系：

```text
Question.current_version_id -> QuestionVersion.id
QuestionVersion.question_id -> Question.id
```

答案版本关系：

```text
AnswerVersion.question_id -> Question.id
AnswerVersion.question_version_id -> QuestionVersion.id
```

评分规则版本关系：

```text
ScoringRubricVersion.question_id -> Question.id
ScoringRubricVersion.question_version_id -> QuestionVersion.id
ScoringRubricVersion.answer_version_id -> AnswerVersion.id
```

答题记录必须绑定历史版本：

```text
AnswerAttempt.question_version_id
AnswerAttempt.answer_version_id
AnswerAttempt.rubric_version_id
```

不变量：

```text
历史 AnswerAttempt 不随当前版本变化而改变。
Question 的 active 版本变化，只影响后续答题。
```

## 7. 状态机

### 7.1 沉淀任务状态机

```text
submitted
-> extracting
-> generated
-> quality_checking
-> pending_review
-> confirmed
```

异常路径：

```text
submitted/extracting/generated/quality_checking -> failed
pending_review -> rejected
pending_review -> archived
```

审计点：

```text
任务提交
知识提取完成
生成完成
质检完成
用户确认
用户拒绝
任务失败
```

### 7.2 ReviewItem 状态机

```text
pending
-> confirmed
```

其他路径：

```text
pending -> edited -> confirmed
pending -> rejected
pending -> archived
```

### 7.3 Question 状态机

```text
draft
-> pending_confirmation
-> confirmed
-> archived
```

临时题路径：

```text
temporary
-> answered
-> pending_confirmation
-> confirmed
```

未确认临时题：

```text
temporary -> answered -> learning_record_only
```

### 7.4 版本对象状态机

适用对象：

```text
QuestionVersion
AnswerVersion
ScoringRubricVersion
CoreExplanationVersion
```

状态流：

```text
draft -> active -> archived
```

不变量：

```text
同一业务对象同一时间只能有一个 active 当前版本。
历史版本不可物理删除，只能 archived。
```

### 7.5 质量校验状态机

```text
pending
-> rule_checked
-> ai_checked
-> passed
```

修正路径：

```text
ai_checked -> auto_fixed -> rule_checked
```

失败路径：

```text
ai_checked -> failed_manual_required
auto_fixed 超过 2-3 次 -> failed_manual_required
```

### 7.6 PracticeSession 状态机

```text
created -> in_progress -> completed -> reviewed
```

异常路径：

```text
created / in_progress -> cancelled
```

### 7.7 来源冲突状态机

```text
detected
-> pending_user_confirmation
-> resolved
```

其他路径：

```text
pending_user_confirmation -> ignored
pending_user_confirmation -> archived
```

不变量：

```text
来源冲突不得自动覆盖 active 标准答案。
用户确认前，只能生成冲突说明和候选更新。
```

## 8. 业务规则和不变量

```text
未确认内容不得进入正式题库。
未确认临时题不得计入长期掌握画像。
AnswerAttempt 必须绑定答题时使用的 QuestionVersion、AnswerVersion、ScoringRubricVersion。
正式入库的 Question 必须至少有一个 active QuestionVersion、AnswerVersion、ScoringRubricVersion。
题目、答案、评分规则、核心讲解的 AI 生成内容必须有 GenerationRecord。
题目正式入库前必须有 QualityCheckRecord。
用户修正 AI 评分时必须保留 AI 原始评分和差异原因。
来源冲突不得自动覆盖 active 标准答案，必须进入用户确认。
外部 Agent 提交沉淀任务必须支持幂等键。
同一业务对象同一时间只能有一个 active 当前版本。
审计事件不得被业务删除。
```

## 9. 持久化数据、临时数据和派生数据

持久化数据：

```text
User
KnowledgeDomain
KnowledgeTopic
KnowledgePoint
KnowledgeType
Question
QuestionVersion
AnswerVersion
ScoringRubricVersion
CoreExplanation
CoreExplanationVersion
IngestionTask
ReviewItem
PracticeSession
AnswerAttempt
ErrorSet
SourceReference
GenerationRecord
QualityCheckRecord
ModelCallRecord
AuditEvent
```

临时数据：

```text
临时题当次作答上下文
Agent 聊天框返回的短预览
AI 生成过程中的中间草稿
质量校验自动修正过程中的候选结果
```

派生数据：

```text
MasteryProfile
领域级掌握画像
主题级掌握画像
知识点级掌握画像
错误原因摘要
下一步练习建议
模型质量统计
```

派生数据规则：

```text
派生数据必须可由持久化事实重新计算。
MasteryProfile 的数据来源主要是 AnswerAttempt、ErrorSet、Question、KnowledgePoint。
模型质量统计的数据来源主要是 GenerationRecord、QualityCheckRecord、ModelCallRecord、用户确认/修正记录。
```

## 10. 人工步骤与自动步骤

人工步骤：

```text
用户发起主题学习、即时掌握或外部会话沉淀。
用户确认领域、主题、知识点归属。
用户确认待入库内容。
用户编辑题目、答案、讲解或评分规则。
用户答题。
用户确认或修正 AI 评分。
用户决定临时题是否入库，以及是否补计入长期画像。
用户处理来源冲突。
```

自动步骤：

```text
AI 提取知识点。
AI 推荐领域、主题和知识点。
AI 生成核心讲解、题目、答案、评分规则。
系统执行规则校验。
AI 执行质量校验。
AI 自动修正不通过题目。
AI 对用户答案评分。
系统生成错误集。
系统重算掌握画像。
系统生成针对性追问建议。
系统记录审计事件。
```

## 11. 核心用户路径覆盖

主题学习：

```text
KnowledgeTopic -> KnowledgePoint -> IngestionTask -> ReviewItem -> Question -> confirmed
```

即时掌握：

```text
IngestionTask(instant_mastery) -> temporary Question -> AnswerAttempt -> optional ReviewItem -> confirmed
```

外部会话沉淀：

```text
SourceReference(external_conversation) -> IngestionTask -> ReviewItem -> Agent preview -> user confirmation -> confirmed
```

答题评分：

```text
PracticeSession -> Question -> AnswerAttempt -> AI score -> user confirmation -> MasteryProfile recalculation
```

错误集复盘：

```text
AnswerAttempt low score -> ErrorSet -> PracticeSession(error_set) -> new AnswerAttempt
```

## 12. 下一步进入 ER 图

ER 图需要覆盖：

```text
核心知识结构
沉淀任务和待确认队列
题目版本链
答题和掌握画像
来源、生成、模型调用、质量校验、审计
```


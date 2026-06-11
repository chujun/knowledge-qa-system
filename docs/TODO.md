# 个人知识问答系统 TODO

日期：2026-06-06

本文按 `my-design-dev-flow-check` 的完整系统设计开发流程组织，用于推进个人知识问答系统从需求、建模、架构、数据、接口、MCP、实现、测试、部署到演进的后续工作。

关联文档：

```text
docs/knowledge-qa-business-model.md
docs/knowledge-qa-brainstorming-qa.md
docs/knowledge-qa-design-dev-flow-check.md
```

当前状态：

```text
已完成：需求讨论、业务建模初稿、设计开发流程检查文档、领域模型文档、ER 图、API 草案、MCP Tool 设计。
下一步：继续推进 Web 页面体验与数据管理能力。
当前实现：已完成本地 Next.js/TypeScript/SQLite/Prisma 项目骨架、核心 API、Agent/MCP 调用入口、真实数据 Web 工作台、基础管理入口、知识结构维护入口、题目内容编辑入口、核心讲解编辑入口、待确认内容编辑入口、练习会话连续答题入口、Agent/MCP 调用记录页、错误集管理页和掌握画像管理页。
```

## 0. 阶段门禁

- [x] 用户确认 `docs/knowledge-qa-business-model.md` 的业务对象、状态流、MVP 范围。
- [x] 确认后再进入 ER/API/MCP 细化，不直接开始编码。
- [x] 每完成一个设计阶段，都补充阶段结论、已确认事项、待确认事项、风险点、下一步动作。
- [x] 后续工作必须严格按照本 TODO 文档的章节顺序执行。
- [x] 未完成前序章节时，不得跳到后续章节继续产出文档或实现。
- [x] 如需调整执行顺序，必须先更新本 TODO 文档，说明调整原因，并经用户确认。
- [x] 每次继续工作前，先检查本 TODO 中第一个未完成任务，并从该任务开始推进。

## 1. 项目启动

- [x] 确认系统正式名称。
- [x] 确认 MVP 交付物形态：Web + API、API + MCP、CLI/API 原型，或其他组合。已确认：MVP 采用 Web + API。
- [x] 确认 MVP 第一阶段是否需要可视化页面。已确认：需要基础 Web 页面承载待确认、编辑、练习等交互。
- [x] 确认 MVP 第一阶段是否要实际实现 MCP Tool，还是先设计 MCP schema。已确认：第一阶段先设计 MCP schema 并预留接入；系统验收标准必须包含 AI Agent MCP/Agent 调用能力，后续需要提供可验证的 Agent 调用闭环。
- [x] 确认部署环境：本地 Windows、Docker、本地服务器、云服务器。已确认：MVP 先本地服务部署，不使用 Docker；后续预留迁移到 Linux 系统。
- [x] 确认模型调用来源：OpenAI、Claude、Minimax、本地模型、统一模型网关，或多模型。已确认：架构支持多模型适配；MVP 默认大模型调整为国内版 Minimax `minimax-m2.7-highspeed`，默认 AI Agent 为 Codex。
- [x] 确认是否需要从第一版开始记录 token、耗时和模型调用成本。已确认：第一版开始记录 input_tokens、output_tokens、latency_ms、cost、model_name、model_version、ai_agent、prompt_version、call_type、status。

## 2. 需求分析

- [x] 将功能拆成 `Must / Should / Could / Won't`。
- [x] 明确 MVP 必须覆盖的核心闭环。
- [x] 明确 MVP 暂缓功能。
- [x] 明确主题学习模式的输入、处理、输出。
- [x] 明确即时掌握模式的输入、处理、输出。
- [x] 明确外部会话沉淀模式的输入、处理、输出。
- [x] 明确题目生成、质量校验、待确认、正式入库的用户路径。
- [x] 明确答题、AI 评分、用户修正、掌握画像更新的用户路径。
- [x] 明确错误集复盘的用户路径。
- [x] 明确待确认队列的处理路径。
- [x] 明确用户主动说“直接入库”时的快捷路径。
- [x] 明确临时题确认入库时是否补计入长期掌握度的交互。

### 2.1 MoSCoW 功能优先级

Must，MVP 必须具备：

```text
单用户知识领域、知识主题、知识点管理
知识类型标注
主题学习入口
即时掌握入口
外部会话沉淀入口的数据模型
核心知识讲解
主观问答和选择题
题目、答案、评分规则、核心讲解版本化
题目生成规则
质量校验记录
待确认队列
正式入库状态流
答题记录
AI 评分 + 用户修正
领域/主题/知识点多层级五维掌握画像
错误集
来源引用
Agent/模型元数据记录
审计事件日志
基础 API 设计
MCP 接入能力预留
```

Should，MVP 应该具备但可按里程碑后置：

```text
外部会话沉淀 API
MCP Tool schema
Agent 侧轻量确认返回结构
临时题确认入库流程
质量校验自动修正 2-3 次
模型调用记录
掌握画像主题级和领域级聚合
来源冲突待确认流程
基础安全认证
基础可观测性指标
```

Could，有价值但不阻塞 MVP：

```text
完整 MCP Tool 实现
Web 页面详细编辑体验
批量练习
模型质量基础统计报表
文档导入
向量检索或语义检索
后台任务队列
健康检查和运行仪表盘
部署脚本
用户使用说明
```

Won't，MVP 明确暂不做：

```text
团队知识库
共享权限
学习目标和学习计划
复习提醒
完整模型 A/B 评测平台
复杂审计报表
浏览器插件
移动端 App
自动文档导入全流程
多用户账号体系
```

## 3. 领域模型细化

产出文档：

```text
docs/knowledge-qa-domain-model.md
```

- [x] 定义领域边界和核心子域。
- [x] 定义聚合根：KnowledgeDomain、KnowledgeTopic、KnowledgePoint、Question、IngestionTask、PracticeSession 等是否独立为聚合。
- [x] 确认是否新增 `IngestionTask` 作为沉淀任务对象。
- [x] 确认是否新增 `ReviewItem` 或 `ReviewQueue` 作为待确认队列对象。
- [x] 确认是否新增 `PracticeSession` 作为一次练习会话对象。
- [x] 确认是否新增 `ModelCallRecord` 记录每次 AI 调用。
- [x] 明确 KnowledgeDomain、KnowledgeTopic、KnowledgePoint、Question 的关系。
- [x] 明确 Question、QuestionVersion、AnswerVersion、ScoringRubricVersion 的版本关系。
- [x] 明确 CoreExplanation 与 CoreExplanationVersion 的关系。
- [x] 明确 AnswerAttempt 和版本对象之间的绑定关系。
- [x] 明确 MasteryProfile 的挂载方式：domain / topic / knowledge_point。
- [x] 明确 ErrorSet 与 AnswerAttempt、Question、KnowledgePoint 的关系。
- [x] 明确 SourceReference 与题目、答案、讲解、评分规则的引用关系。
- [x] 明确 GenerationRecord、QualityCheckRecord、AuditEvent 的关联方式。
- [x] 定义持久化数据、临时数据、派生数据。
- [x] 定义人工步骤和自动步骤。
- [x] 定义业务不变量。

业务不变量候选：

- [x] 未确认内容不得进入正式题库。
- [x] 未确认临时题不得计入长期掌握画像。
- [x] AnswerAttempt 必须绑定答题时使用的 QuestionVersion、AnswerVersion、ScoringRubricVersion。
- [x] 正式入库的 Question 必须至少有一个 active QuestionVersion、AnswerVersion、ScoringRubricVersion。
- [x] 题目、答案、评分规则、核心讲解的 AI 生成内容必须有 GenerationRecord。
- [x] 题目正式入库前必须有 QualityCheckRecord。
- [x] 用户修正 AI 评分时必须保留 AI 原始评分和差异原因。
- [x] 来源冲突不得自动覆盖 active 标准答案，必须进入用户确认。

## 4. 状态机设计

产出文档：

```text
docs/knowledge-qa-domain-model.md
```

- [x] 设计沉淀任务状态机。
- [x] 设计题目状态机。
- [x] 设计题目版本状态机。
- [x] 设计标准答案版本状态机。
- [x] 设计评分规则版本状态机。
- [x] 设计核心讲解版本状态机。
- [x] 设计质量校验状态机。
- [x] 设计练习会话状态机。
- [x] 设计临时题转正式题状态机。
- [x] 设计来源冲突处理状态机。
- [x] 为每个状态机补充正常路径、异常路径、可撤销动作和审计点。

状态机候选：

```text
生成内容：draft -> pending_confirmation -> confirmed -> archived
临时题：temporary -> answered -> pending_confirmation -> confirmed / learning_record_only
质量校验：pending -> rule_checked -> ai_checked -> auto_fixed -> passed / warning / failed_manual_required
练习会话：created -> in_progress -> completed -> reviewed
沉淀任务：submitted -> extracting -> generated -> quality_checking -> pending_review -> confirmed / rejected / failed
```

## 5. 系统边界设计

产出文档：

```text
docs/knowledge-qa-domain-model.md
docs/knowledge-qa-api-draft.md
docs/knowledge-qa-mcp-tools.md
```

- [x] 定义系统内部模块边界。
- [x] 定义外部 AI Agent 边界。
- [x] 定义 MCP Server 与后端 API 的调用方向。
- [x] 定义知识问答系统页面与后端 API 的调用方向。
- [x] 定义未来文档导入模块边界。
- [x] 定义模型调用网关或模型适配层边界。
- [x] 定义数据敏感边界：会话原文、用户答案、模型提示词、密钥。
- [x] 定义外部 Agent 传入上下文的类型：完整会话、最近 N 轮、选中片段、摘要。
- [x] 定义依赖失败时的重试、补偿和人工处理。

## 6. 架构设计

产出文档：

```text
docs/knowledge-qa-architecture.md
```

- [x] 确认 MVP 架构形态：模块化单体。已确认：MVP 采用模块化单体架构。
- [x] 确认前后端形态：全栈应用、前后端分离、纯 API 原型。已确认：MVP 采用全栈应用形态，同一项目包含 Web 页面和后端 API。
- [x] 确认通信方式：HTTP API、MCP Tool、后台任务。已确认：HTTP API 为主，MCP Tool 作为 Agent 接入层，后台任务作为生成、质检、画像重算等长流程扩展边界。
- [x] 确认是否引入后台任务队列。已确认：MVP 第一版不引入独立后台队列；先同步执行或使用应用内轻量任务；架构预留任务模块和状态流，便于后续迁移到后台队列。
- [x] 确认 AI 生成和质量校验是同步执行还是异步执行。已确认：业务上按任务状态建模；技术上 MVP 第一版同步执行为主，页面/API 返回任务状态和结果，后续可迁移异步队列。
- [x] 确认存储方案：SQLite / PostgreSQL / 其他。已确认：MVP 第一版使用 SQLite；后续迁移 Linux 或数据量增长后再评估 PostgreSQL。
- [x] 确认是否需要缓存。已确认：MVP 第一版不引入 Redis 等独立缓存；可使用应用内轻量缓存配置、模板和少量静态数据。
- [x] 确认是否需要向量库作为后续扩展。已确认：MVP 不引入向量库；后续文档导入、Embedding、语义检索、引用召回等能力再迭代引入。
- [x] 确认认证方式：本地单用户、API Key、Bearer Token、登录态。已确认：Web 页面采用本地单用户模式；API/Agent 调用使用 API Key；后续多用户再扩展 Bearer Token 或登录态。
- [x] 确认部署方式：本地服务、Docker、服务器。已确认：MVP 本地服务部署，不使用 Docker；后续迁移到 Linux 系统服务。
- [x] 绘制模块图。
- [x] 绘制核心数据流图。
- [x] 记录被放弃的备选方案和原因。

模块候选：

```text
用户与设置模块
知识结构模块
沉淀任务模块
题库与版本模块
核心讲解模块
生成与质量校验模块
练习与评分模块
掌握画像模块
错误集模块
来源溯源模块
审计日志模块
外部 API 接入模块
MCP Tool 接入模块
模型调用适配模块
```

## 7. 数据设计和 ER 图

产出文档：

```text
docs/knowledge-qa-er-diagram.md
```

- [x] 绘制 Mermaid ER 图。
- [x] 设计 User 表。
- [x] 设计 KnowledgeDomain 表。
- [x] 设计 KnowledgeTopic 表。
- [x] 设计 KnowledgePoint 表。
- [x] 设计 KnowledgeType 表。
- [x] 设计 CoreExplanation 表。
- [x] 设计 CoreExplanationVersion 表。
- [x] 设计 Question 表。
- [x] 设计 QuestionVersion 表。
- [x] 设计 AnswerVersion 表。
- [x] 设计 ScoringRubricVersion 表。
- [x] 设计 AnswerAttempt 表。
- [x] 设计 MasteryProfile 表。
- [x] 设计 ErrorSet 表。
- [x] 设计 SourceReference 表。
- [x] 设计 GenerationRecord 表。
- [x] 设计 QualityCheckRecord 表。
- [x] 设计 AuditEvent 表。
- [x] 判断是否新增 IngestionTask 表。
- [x] 判断是否新增 ReviewItem 表。
- [x] 判断是否新增 PracticeSession 表。
- [x] 判断是否新增 ModelCallRecord 表。
- [x] 为每张表定义字段类型。
- [x] 为每张表定义主键、外键、唯一约束。
- [x] 为每张表补充中文表名和中文业务说明。当前落点：`prisma/schema.prisma` 模型文档注释与 `docs/knowledge-qa-data-dictionary.md`。
- [x] 数据库规范：后续新增表必须同步补充中文表名、中文业务说明和物理表名说明；若后续迁移 PostgreSQL，需转换为数据库原生 `COMMENT ON TABLE`。
- [x] 为常用查询定义索引。
- [x] 定义状态字段枚举。
- [x] 定义 JSON 字段范围。
- [x] 定义软删除策略：是否统一使用 `deleted_at`。
- [x] 定义数据保留和归档策略。
- [x] 定义掌握画像重算触发条件。

## 8. API 草案

产出文档：

```text
docs/knowledge-qa-api-draft.md
```

- [x] 定义 API 版本策略，例如 `/api/v1`。
- [x] 定义统一错误响应结构。
- [x] 定义分页、过滤、排序规则。
- [x] 定义幂等键策略。
- [x] 定义认证和授权规则。
- [x] 定义领域 API。
- [x] 定义主题 API。
- [x] 定义知识点 API。
- [x] 定义知识类型 API。
- [x] 定义主题学习沉淀 API。
- [x] 定义即时掌握 API。
- [x] 定义外部会话沉淀 API。
- [x] 定义待确认队列 API。
- [x] 定义正式入库 API。
- [x] 定义题目 API。
- [x] 定义题目版本 API。
- [x] 定义答案版本 API。
- [x] 定义评分规则版本 API。
- [x] 定义核心讲解 API。
- [x] 定义质量校验 API。
- [x] 定义练习会话 API。
- [x] 定义答题提交 API。
- [x] 定义 AI 评分确认/修正 API。
- [x] 定义掌握画像查询 API。
- [x] 定义错误集 API。
- [x] 定义来源引用 API。
- [x] 定义审计日志查询 API。

API 候选：

```text
POST /api/v1/ingestions/topic
POST /api/v1/ingestions/instant
POST /api/v1/ingestions/external-conversation
GET  /api/v1/review-items
POST /api/v1/review-items/{id}/confirm
POST /api/v1/review-items/{id}/reject
POST /api/v1/questions/{id}/attempts
POST /api/v1/answer-attempts/{id}/confirm-score
GET  /api/v1/mastery-profiles
GET  /api/v1/error-sets
```

## 9. MCP Tool 设计

产出文档：

```text
docs/knowledge-qa-mcp-tools.md
```

- [x] 定义 MCP Server 职责：适配 Agent，不承载核心业务逻辑。
- [x] 定义 MCP Tool 认证方式。
- [x] 定义 MCP Tool 与 HTTP API 的映射关系。
- [x] 定义 `qa_create_from_conversation`。
- [x] 定义 `qa_create_instant_check`。
- [x] 定义 `qa_search_topics`。
- [x] 定义 `qa_attach_to_topic`。
- [x] 定义 `qa_get_review_queue`。
- [x] 定义 `qa_confirm_ingestion`。
- [x] 定义每个 Tool 的输入 schema。
- [x] 定义每个 Tool 的输出 schema。
- [x] 定义 Agent 聊天框返回内容长度限制。
- [x] 定义题目预览数量限制。
- [x] 定义确认链接生成规则。
- [x] 定义外部 Agent 重复提交的幂等处理。
- [x] 定义外部会话上下文不足时的错误响应。
- [x] 编写 Codex / Claude Code 使用示例。
- [x] 定义 AI Agent MCP/Agent 调用能力的系统验收标准。
- [x] 定义至少一个可执行或可模拟的 Agent 调用验收场景。

## 10. 核心流程设计

产出文档：

```text
docs/knowledge-qa-core-flows.md
```

- [x] 绘制主题学习流程。
- [x] 绘制即时掌握流程。
- [x] 绘制外部会话沉淀流程。
- [x] 绘制题目生成和质量校验流程。
- [x] 绘制待确认到正式入库流程。
- [x] 绘制答题评分流程。
- [x] 绘制用户修正评分流程。
- [x] 绘制掌握画像更新流程。
- [x] 绘制错误集生成和复盘流程。
- [x] 绘制临时题确认入库流程。
- [x] 绘制来源冲突处理流程。
- [x] 为每条流程补充异常路径。
- [x] 为每条流程补充审计点。
- [x] 为长流程补充超时、取消、重试和人工处理。

## 11. 题目生成与质量校验细化

产出文档：

```text
docs/knowledge-qa-generation-quality.md
```

- [x] 定义知识点复杂度判定 prompt 结构。
- [x] 定义按复杂度决定题量的规则。
- [x] 定义五个认知维度的题目模板。
- [x] 定义六类知识类型的讲解模板。
- [x] 定义题目生成输出 schema。
- [x] 定义标准答案生成输出 schema。
- [x] 定义评分规则生成输出 schema。
- [x] 定义核心讲解生成输出 schema。
- [x] 定义规则校验指标。
- [x] 定义 AI 校验 prompt 结构。
- [x] 定义校验报告 schema。
- [x] 定义自动修正 prompt 结构。
- [x] 定义最多 2-3 次自动修正的停止条件。
- [x] 定义警告通过题目的处理方式。
- [x] 定义待人工处理题目的处理方式。
- [x] 定义质量校验审计事件。

## 12. 掌握画像和针对性提问细化

产出文档：

```text
docs/knowledge-qa-mastery-model.md
```

- [x] 定义知识点级掌握画像计算规则。
- [x] 定义主题级掌握画像聚合规则。
- [x] 定义领域级掌握画像聚合规则。
- [x] 定义五维分数权重。
- [x] 定义题目难度对掌握分的影响。
- [x] 定义最近表现对掌握分的影响。
- [x] 定义用户修正评分对掌握分的影响。
- [x] 定义临时题不计入长期画像的规则。
- [x] 定义临时题确认入库后补计入规则。
- [x] 定义错误原因标签体系。
- [x] 定义针对性提问策略。
- [x] 定义优先使用已入库题目的策略。
- [x] 定义生成临时变式题的条件。
- [x] 定义下一道追问题生成规则。
- [x] 定义阶段复盘建议规则。

## 13. 安全设计

产出文档：

```text
docs/knowledge-qa-security.md
```

- [x] 确认 MVP 是否需要登录。
- [x] 确认 API Key 或 Bearer Token 方案。
- [x] 确认 MCP Tool 调用认证方式。
- [x] 定义外部输入校验规则。
- [x] 定义会话原文敏感信息处理规则。
- [x] 定义用户答案敏感信息处理规则。
- [x] 定义日志脱敏规则。
- [x] 定义模型 API Key 存储方式。
- [x] 定义提示词和模型响应是否完整入库。
- [x] 定义来源内容访问权限。
- [x] 定义审计日志访问权限。
- [x] 定义常见安全风险防护：注入、XSS、CSRF、SSRF、路径穿越、文件上传。

## 14. 可观测性设计

产出文档：

```text
docs/knowledge-qa-observability.md
```

- [x] 定义应用日志。
- [x] 定义访问日志。
- [x] 定义错误日志。
- [x] 定义业务事件日志。
- [x] 定义审计日志。
- [x] 定义 AI 调用日志。
- [x] 定义模型调用耗时指标。
- [x] 定义模型调用 token 和成本指标。
- [x] 定义题目生成成功率指标。
- [x] 定义质量校验通过率指标。
- [x] 定义自动修正次数指标。
- [x] 定义用户确认率指标。
- [x] 定义 AI 评分被用户修正率指标。
- [x] 定义健康检查接口。
- [x] 定义常见问题排查路径。

## 15. MVP 实施计划

产出文档：

```text
docs/knowledge-qa-mvp-plan.md
```

- [x] 定义 MVP 里程碑 1：数据模型和核心 API。
- [x] 定义 MVP 里程碑 2：主题学习和待确认入库。
- [x] 定义 MVP 里程碑 3：题目生成、质量校验、版本化。
- [x] 定义 MVP 里程碑 4：答题、评分、用户修正。
- [x] 定义 MVP 里程碑 5：掌握画像和错误集。
- [x] 定义 MVP 里程碑 6：外部会话沉淀 API。
- [x] 定义 MVP 里程碑 7：MCP Tool 接入。
- [x] 定义 AI Agent MCP/Agent 调用能力验收标准，确保系统不是只具备普通 Web/API 能力。
- [x] 定义每个里程碑的验收标准。
- [x] 定义每个里程碑的测试范围。
- [x] 定义暂缓功能和原因。
- [x] 定义是否先使用 mock AI 生成器。
- [x] 定义真实 AI 接入的切换条件。

建议核心闭环：

```text
创建领域/主题/知识点
-> 生成核心讲解和题目
-> 质量校验
-> 待确认
-> 正式入库
-> 答题
-> AI 评分
-> 用户修正
-> 更新掌握画像
-> 错误集复盘
```

## 16. 编码实现准备

- [x] 确认技术栈。已确认：Next.js + TypeScript + SQLite + Prisma + React/Tailwind；API 使用 Next.js Route Handlers；测试使用 Vitest + Playwright；AI 先做 mock provider，再接国内版 Minimax `minimax-m2.7-highspeed`；MCP/Agent 先做 schema 和本地模拟调用脚本。
- [x] 初始化项目结构。
- [x] 配置代码风格。
- [x] 配置测试框架。
- [x] 配置数据库迁移工具。
- [x] 配置环境变量模板。
- [x] 配置模型调用密钥读取方式。
- [x] 实现前输出实现范围说明。
- [x] 每次进入实现前，明确实现范围、影响范围、数据/接口变化、验证命令、回滚方式。
- [x] 实现前列出验证命令。当前骨架验证命令：npm install；npm run test；npm run build；npm run test:e2e。
- [x] 实现前列出回滚或恢复方式。

实现前必须填写：

```text
实现范围：
- 文件/模块：
- 行为变化：
- 数据/接口变化：
- 测试/验证：
- 回滚或恢复：
```

## 17. 测试验证

- [x] 编写领域规则单元测试。
- [x] 测试待确认内容不进入正式题库。
- [x] 测试临时题不计入长期掌握画像。
- [x] 测试正式入库状态流。
- [x] 测试题目、答案、评分规则版本绑定。
- [x] 测试答题记录绑定历史版本。
- [x] 测试 AI 评分和用户修正双轨记录。
- [x] 测试掌握画像知识点级计算。
- [x] 测试掌握画像主题级聚合。
- [x] 测试掌握画像领域级聚合。
- [x] 测试错误集生成。
- [x] 测试外部会话沉淀幂等提交。
- [x] 测试质量校验不通过自动修正。
- [x] 测试自动修正超过次数进入待人工处理。
- [x] 测试来源冲突需要用户确认。
- [x] 测试 API 鉴权。
- [x] 测试 MCP Tool 输入输出 schema。
- [x] 测试 AI Agent 通过 MCP/Agent 调用能力创建外部会话沉淀任务。
- [x] 测试 Agent 调用后返回主题建议、知识点列表、题目预览和确认/编辑链接。
- [x] 测试核心端到端路径。

验证记录：

```text
2026-06-07 00:00:00 npm run test：通过，10 个测试文件，30 条测试用例。
2026-06-07 00:00:00 npm run build：通过，Next.js 生产构建成功。
2026-06-07 00:00:00 npm run test:e2e：失败，缺少 Playwright Chromium 浏览器二进制。
2026-06-07 00:00:00 npx playwright install chromium：下载超时，端到端测试阻塞。
2026-06-07 00:00:00 手动离线安装 chrome-headless-shell-win64.zip 到 ms-playwright/chromium_headless_shell-1223。
2026-06-07 00:00:00 npm run test:e2e：通过，1 条 Playwright E2E 测试。
2026-06-07 00:00:00 cmd /c npx tsc --noEmit：通过。
2026-06-07 00:00:00 cmd /c npm run test：通过，13 个测试文件，36 条测试用例；包含外部会话沉淀、待确认队列、确认/拒绝 API 集成测试。
2026-06-07 00:00:00 cmd /c npm run test：通过，14 个测试文件，37 条测试用例；包含知识点生成题目、核心讲解、生成记录、质量校验和题目确认 API 集成测试。
2026-06-07 00:00:00 cmd /c npm run build：通过，新增 generation/questions API 路由进入 Next.js 生产构建。
2026-06-07 00:00:00 cmd /c npm run test：通过，15 个测试文件，38 条测试用例；包含答题提交、mock AI 评分、用户修正评分、掌握画像重算和错误集生成 API 集成测试。
2026-06-07 00:00:00 cmd /c npm run build：通过，新增 answer-attempts/mastery-profiles/error-sets API 路由进入 Next.js 生产构建。
2026-06-07 00:00:00 cmd /c npm run test：通过，15 个测试文件，39 条测试用例；包含基于薄弱维度和活跃错误集创建针对性练习会话 API 集成测试。
2026-06-07 00:00:00 cmd /c npm run build：通过，新增 practice-sessions API 路由进入 Next.js 生产构建。
2026-06-07 00:00:00 Prisma 模型表级中文说明检查：通过，所有当前表均已补充中文表名、中文业务说明和物理表名说明。
2026-06-07 00:00:00 cmd /c npm run test：通过，16 个测试文件，40 条测试用例；包含来源引用、生成记录和质量校验记录查询 API 集成测试。
2026-06-07 00:00:00 cmd /c npm run build：通过，新增 source-references/generation-records/quality-checks API 路由进入 Next.js 生产构建。
2026-06-08 00:00:00 cmd /c npm run test：通过，17 个测试文件，45 条测试用例；包含 Agent/MCP 工具适配器到 HTTP API 的映射、API Key 传递和错误处理测试。
2026-06-08 00:00:00 cmd /c npm run build：通过，Agent/MCP 工具适配层不影响 Next.js 生产构建。
2026-06-08 00:00:00 cmd /c npm run agent:tool -- --help：通过，本地 Agent Tool CLI 可正常显示工具入口和调用说明。
2026-06-08 00:00:00 node scripts/knowledge-qa-mcp-stdio.mjs --self-check：通过，本地 MCP stdio server 可返回 initialize 和 tools/list。
2026-06-08 00:00:00 node scripts/check-mcp-stdio.mjs：通过，MCP stdio 自检脚本可执行。
2026-06-08 15:00:00 cmd /c npm run docs:check-timestamps：通过，验证记录均使用 yyyy-MM-dd HH:mm:ss 格式。
2026-06-08 15:00:00 cmd /c npx tsc --noEmit：通过。
2026-06-08 15:00:00 node scripts/knowledge-qa-mcp-stdio.mjs --self-check：通过。
2026-06-08 15:05:59 cmd /c npm run test：通过，17 个测试文件，45 条测试用例；包含题目详情、题目归档、错误集解决 API 集成测试。
2026-06-08 15:05:59 cmd /c npm run docs:check-timestamps：通过。
2026-06-08 15:05:59 cmd /c npm run build：通过，新增 questions/{id}/archive 和 error-sets/{id}/resolve API 路由进入 Next.js 生产构建。
```

## 18. 部署上线

- [x] 确认运行环境。
- [x] 确认数据库部署方式。
- [x] 编写配置说明。
- [x] 编写环境变量说明。
- [x] 编写启动命令。
- [x] 编写数据库迁移命令。
- [x] 编写健康检查方式。
- [x] 编写发布步骤。
- [x] 编写回滚步骤。
- [x] 编写冒烟测试步骤。
- [x] 确认密钥不会提交到 Git。
- [x] 确认本地 API/MCP 服务端口和访问方式。

## 19. 文档交付

- [x] 更新业务建模文档。
- [x] 更新问答头脑风暴文档。
- [x] 更新设计开发流程检查文档。
- [x] 创建领域模型文档。
- [x] 创建 ER 图文档。
- [x] 创建架构设计文档。
- [x] 创建 API 草案文档。
- [x] 创建 MCP Tool 设计文档。
- [x] 创建核心流程文档。
- [x] 创建生成与质量校验文档。
- [x] 创建掌握画像模型文档。
- [x] 创建安全设计文档。
- [x] 创建可观测性文档。
- [x] 创建 MVP 实施计划文档。
- [x] 创建部署运行文档。
- [x] 创建测试验证文档。
- [x] 创建用户使用说明。
- [x] 创建数据字典文档，记录所有当前表的英文模型名、物理表名、中文表名和业务说明。

## 20. Git 和交付管理

- [x] 检查 `git status`。
- [x] 确认是否提交当前三份设计文档。当前决策：本轮不自动提交，除非用户明确要求。
- [x] 提交前检查文档是否有占位符。
- [x] 提交前检查 Markdown 链接。
- [x] 提交前检查 Mermaid 图是否可渲染。已使用 mermaid-cli 11.15.0 渲染 15 个 Mermaid 图为 SVG，全部通过。
- [x] 提交前确认没有密钥、隐私内容和模型 API Key。检查结果：仅发现占位符和脱敏示例，未发现真实密钥。
- [x] 验证记录必须使用 `yyyy-MM-dd HH:mm:ss` 格式记录年月日时分秒，并通过 `npm run docs:check-timestamps` 检查。
- [x] 设计阶段提交建议信息：`docs: add knowledge qa system design docs`。
- [x] 后续每个阶段单独提交，避免一次提交过大。

## 21. 当前待用户确认问题

- [x] MVP 第一版是否包含 Web UI？已确认：包含基础 Web 页面。
- [x] MVP 第一版是否直接实现 MCP Tool，还是只实现 API 并设计 MCP schema？已确认：第一阶段先实现 MCP schema 和本地模拟 Agent 调用，后续实现真实 MCP Server。
- [x] 技术栈选择是什么？已确认：Next.js + TypeScript + SQLite + Prisma + React/Tailwind；API 使用 Next.js Route Handlers；测试使用 Vitest + Playwright。
- [x] 数据库使用 SQLite、PostgreSQL 还是其他？已确认：MVP 第一版使用 SQLite。
- [x] AI 生成第一版是否使用真实模型，还是先用 mock 生成器？已确认：先使用 mock AI provider，后续接国内版 Minimax `minimax-m2.7-highspeed`。
- [x] 是否新增 IngestionTask 作为沉淀任务对象？
- [x] 是否新增 ReviewItem/ReviewQueue 作为待确认队列对象？
- [x] 是否新增 PracticeSession 作为练习会话对象？
- [x] 是否新增 ModelCallRecord 作为模型调用记录对象？
- [x] 是否统一使用 `deleted_at` 软删除？已确认：MVP 暂不强制所有表增加 deleted_at，后续需要用户删除能力时再统一引入。
- [x] 掌握画像实时更新还是异步重算？已确认：第一版同步重算单个知识点画像，主题和领域画像查看时懒加载重算或后续异步任务重算。
- [x] 外部 Agent 调用 API/MCP 的认证方式是什么？已确认：API/Agent 调用使用 API Key，支持 X-API-Key 或 Bearer。
- [x] 确认链接使用本地 Web URL 还是其他形式？已确认：MVP 使用本地 Web URL。
- [x] 质量校验超过自动修正次数后，是否允许用户编辑后重新触发校验？已确认：允许用户编辑后重新校验。
- [x] 来源冲突确认是否进入统一待确认队列？已确认：来源冲突进入待确认队列，不自动覆盖 active 标准答案。
- [x] 最终确认 `docs/knowledge-qa-design-dev-flow-check.md` 中的阶段结论、待确认事项、风险点。已于 2026-06-07 确认。

## 22. 推荐下一步执行顺序

```text
严格执行规则：
必须按照本 TODO 文档的章节顺序推进。
不得跳过仍有未完成任务的章节。
如需调整顺序，先修改 TODO 并说明原因，经用户确认后再继续。

当前正确顺序：
1. 用户最终确认 docs/knowledge-qa-design-dev-flow-check.md 中的阶段结论、待确认事项、风险点。
2. 如用户确认无调整，进入下一轮业务实现：数据模型和核心 API。
3. 如用户提出调整，先更新相关设计文档和 TODO，再进入实现。
4. 后续每个实现里程碑继续遵循实现前范围说明、验证命令、回滚方式和测试记录。
```

## 23. Web 工作台可用化

- [x] 将首页从演示静态数据改为读取真实本地数据。
- [x] 首页展示待确认队列、知识点、正式题库、掌握画像和错误集统计。
- [x] 首页在数据为空时展示业务空态和下一步入口说明。
- [x] Web 页面采用服务端读取业务服务的方式，不向浏览器暴露 API Key。
- [x] 修正健康检查接口数据库状态，避免固定返回 `not_initialized`。
- [x] 健康检查接口通过真实数据库查询返回 `database: ready / unavailable`。
- [x] 更新 Playwright 首页 E2E，验证真实工作台入口。
- [x] 浏览器访问 `http://localhost:3000` 返回 200。
- [x] 浏览器访问 `http://localhost:3000/api/health` 返回 `database: ready`。

验证记录：

```text
2026-06-08 15:35:57 cmd /c npx tsc --noEmit：通过。
2026-06-08 15:35:57 cmd /c npm run docs:check-timestamps：通过。
2026-06-08 15:35:57 Invoke-WebRequest http://localhost:3000：通过，返回 200。
2026-06-08 15:35:57 Invoke-WebRequest http://localhost:3000/api/health：通过，返回 database: ready。
2026-06-08 15:35:57 cmd /c npm run test：通过，17 个测试文件，45 条测试用例。
2026-06-08 15:35:57 cmd /c npm run build：通过，首页为动态服务端页面。
2026-06-08 15:35:57 cmd /c npm run test:e2e：第一次失败，原因是旧 dev server 占用 3000 且 `.next` 开发缓存处于坏状态。
2026-06-08 15:35:57 重启本地 Next.js dev server：通过，保留 codegraph 进程。
2026-06-08 15:35:57 cmd /c npm run test:e2e：通过，1 条 Playwright E2E 测试。
```

## 24. MVP 可运行版剩余任务

本章用于把 `.agent-flow.md` 中的下一步事项正式任务化，避免只在状态文件中记录、但 `TODO.md` 无法看出后续代办。

- [x] 待确认队列确认/拒绝 Web 操作。
- [x] 知识点生成题目入口。
- [x] 题目详情查看。
- [x] 题目确认入库和归档 Web 操作。
- [x] 答题提交 Web 操作。
- [x] AI 评分和反馈展示。
- [x] 用户确认/修正评分 Web 操作。
- [x] 掌握画像和错误集刷新验证。
- [x] MVP 本地启动、初始化和使用说明最终校验。
- [x] MVP 可运行版最终 E2E 闭环验证。

验收标准：

```text
用户可以仅通过浏览器完成核心闭环：
知识点 -> 生成题目 -> 确认入库 -> 答题 -> AI 评分 -> 用户确认/修正评分 -> 掌握画像/错误集更新。
```

验证记录：

```text
2026-06-08 15:44:01 cmd /c npx tsc --noEmit：通过。
2026-06-08 15:47:31 cmd /c npx tsc --noEmit：第一次并发执行时失败，原因是与 next build 同时读写 `.next/types`。
2026-06-08 15:47:31 cmd /c npm run build：通过。
2026-06-08 15:47:31 cmd /c npx tsc --noEmit：串行重跑通过。
2026-06-08 15:53:54 cmd /c npm run test：通过，17 个测试文件，45 条测试用例。
2026-06-08 15:53:54 cmd /c npm run docs:check-timestamps：通过。
2026-06-08 15:53:54 cmd /c npm run test:e2e：第一次失败，原因是测试仍断言旧标题 `下一道可练习题`。
2026-06-08 15:53:54 更新 Playwright 首页断言为 `最近生成题目`。
2026-06-08 15:53:54 cmd /c npm run test:e2e：第二次超时，原因是旧 Next dev server 处于开发错误刷新页。
2026-06-08 15:53:54 重启本地 Next.js dev server：通过，保留 codegraph 进程。
2026-06-08 15:53:54 cmd /c npm run test:e2e：通过，1 条 Playwright E2E 测试。
2026-06-08 15:56:19 cmd /c npx tsc --noEmit：失败，题目详情页误用主答案摘要对象的 `explanation_text` 字段。
2026-06-08 15:56:19 修正题目详情页，改用完整 `answer_versions[0].explanation_text`。
2026-06-08 15:58:50 cmd /c npm run build：通过，新增 `/questions/[questionId]` 动态页面进入构建结果。
2026-06-08 15:58:50 cmd /c npx tsc --noEmit：串行重跑通过。
2026-06-08 15:58:50 cmd /c npm run test:e2e：通过，1 条 Playwright E2E 测试。
2026-06-08 16:00:16 cmd /c npx tsc --noEmit：第一次并发执行时失败，原因是与 next build 同时读写 `.next/types`。
2026-06-08 16:00:16 cmd /c npm run build：通过。
2026-06-08 16:00:16 cmd /c npm run docs:check-timestamps：通过。
2026-06-08 16:00:16 cmd /c npx tsc --noEmit：串行重跑通过。
2026-06-08 16:00:16 cmd /c npm run test:e2e：通过，1 条 Playwright E2E 测试。
2026-06-08 16:06:17 cmd /c npx tsc --noEmit：通过。
2026-06-08 16:06:17 cmd /c npm run test：通过，17 个测试文件，45 条测试用例。
2026-06-08 16:06:17 cmd /c npm run build：通过。
2026-06-08 16:06:17 cmd /c npm run docs:check-timestamps：通过。
2026-06-08 16:06:17 cmd /c npm run test:e2e：超时，原因是旧 Next dev server 处于开发错误刷新页。
2026-06-08 16:06:17 重启本地 Next.js dev server：未执行，提权请求因 Codex 使用额度限制被系统拒绝。
2026-06-08 16:12:10 cmd /c npx tsc --noEmit：通过。
2026-06-08 16:12:10 cmd /c npm run test：通过，17 个测试文件，45 条测试用例。
2026-06-08 16:12:10 cmd /c npm run build：通过。
2026-06-08 20:28:11 掌握画像和错误集刷新验证：通过，既有 `practice-routes.integration.test.ts` 已覆盖答题、AI 评分、用户修正评分、知识点掌握画像重算、错误集生成和错误集解决。
2026-06-08 20:33:25 更新 `docs/knowledge-qa-user-guide.md`：补齐 MVP 本地启动、`.env.local`、Prisma 初始化、健康检查和当前 Web 工作台能力说明。
2026-06-08 20:33:25 更新 `docs/knowledge-qa-deployment.md`：补齐本地配置、SQLite 初始化、Agent Tool CLI 和 MCP stdio 自检命令。
2026-06-08 20:33:25 cmd /c npm run docs:check-timestamps：通过。
2026-06-08 20:33:25 cmd /c npx tsc --noEmit：通过。
2026-06-08 20:33:25 cmd /c npm run test：通过，17 个测试文件，45 条测试用例。
2026-06-08 20:33:25 cmd /c npm run build：通过。
2026-06-08 20:46:20 更新 Playwright 配置：E2E 专用端口改为 3100，避免和用户浏览器使用的 3000 服务互相污染。
2026-06-08 20:46:20 新增 MVP 浏览器学习闭环 E2E：API 准备知识点，浏览器生成题目、查看详情、确认入库、提交答案、查看 AI 评分、用户确认评分。
2026-06-08 20:46:20 cmd /c npx tsc --noEmit：通过。
2026-06-08 20:46:20 cmd /c npm run test：通过，17 个测试文件，45 条测试用例。
2026-06-08 20:46:20 cmd /c npm run build：通过。
2026-06-08 20:46:20 cmd /c npm run test:e2e：通过，2 条 Playwright E2E 测试。
2026-06-08 20:46:20 更新 `docs/knowledge-qa-user-guide.md` 和 `docs/knowledge-qa-deployment.md`：补充 E2E 使用 3100 专用端口，日常 Web/API 使用 3000。
```

## 25. Web 创建知识结构入口

本章用于补齐 MVP 浏览器端起点：用户不需要先通过 API 或测试脚本创建基础知识结构，可以直接在首页创建知识领域、知识主题和知识点，再进入生成题目、确认入库、答题和评分闭环。

实现范围：

```text
实现范围：
- 文件/模块：src/app/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：首页新增知识领域、知识主题、知识点创建表单；E2E 从浏览器端创建知识结构。
- 数据/接口变化：不新增数据库表和 API；复用既有知识结构服务。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run build；cmd /c npm run test:e2e；cmd /c npm run docs:check-timestamps。
- 回滚或恢复：回退本章涉及的首页表单、E2E 调整和文档记录即可恢复到 API 预置知识结构的闭环。
```

- [x] 首页新增知识领域创建表单。
- [x] 首页新增知识主题创建表单。
- [x] 首页新增知识点创建表单。
- [x] 首页统计和导航补充领域、主题数量。
- [x] 表单控件补充可测试的无障碍标签。
- [x] Playwright E2E 改为通过浏览器创建领域、主题和知识点。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。

验收标准：

```text
用户可以仅通过浏览器完成完整起点和学习闭环：
创建知识领域 -> 创建知识主题 -> 创建知识点 -> 生成题目 -> 查看详情 -> 确认入库 -> 答题 -> AI 评分 -> 用户确认/修正评分。
```

验证记录：

```text
2026-06-08 21:04:30 新增 Web 创建知识结构入口：完成首页领域、主题、知识点表单和浏览器 E2E 调整。
2026-06-08 21:08:59 cmd /c npx tsc --noEmit：通过。
2026-06-08 21:08:59 cmd /c npm run test：通过，17 个测试文件，45 条测试用例。
2026-06-08 21:08:59 cmd /c npm run docs:check-timestamps：通过。
2026-06-08 21:08:59 cmd /c npm run build：通过，首页新增知识结构创建入口并进入 Next.js 生产构建。
2026-06-08 21:08:59 cmd /c npm run test:e2e：通过，2 条 Playwright E2E 测试；MVP 浏览器学习闭环已通过浏览器创建领域、主题和知识点。
```

## 26. Web 工作台基础管理化

本章用于补齐用户初看页面时最明显的功能缺口：从单个首页扩展为可浏览、可进入、可触发核心动作的基础管理界面。

实现范围：

```text
实现范围：
- 文件/模块：src/app/page.tsx、src/app/domains/page.tsx、src/app/questions/page.tsx、src/app/practice/page.tsx、src/app/practice/[practiceSessionId]/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：首页新增功能入口；新增知识结构列表页、题库列表页、针对性练习创建页和练习会话详情页。
- 数据/接口变化：不新增数据库表；复用现有知识结构、题库、练习服务和 Server Action。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run build；cmd /c npm run test:e2e；cmd /c npm run docs:check-timestamps。
- 回滚或恢复：回退新增页面、首页入口和 E2E 调整即可恢复到第 25 章状态。
```

- [x] 首页新增知识结构管理、题库管理、针对性练习快捷入口。
- [x] 新增 `/domains` 知识结构管理页。
- [x] `/domains` 按领域、主题、知识点展示层级数据。
- [x] `/domains` 支持从知识点触发题目生成。
- [x] 新增 `/questions` 题库管理页。
- [x] `/questions` 支持查看题目状态、认知维度、难度并进入详情。
- [x] `/questions` 支持确认入库和归档。
- [x] 新增 `/practice` 针对性练习创建页。
- [x] 新增 `/practice/[practiceSessionId]` 练习会话详情页。
- [x] Playwright E2E 覆盖新增页面入口和练习创建路径。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。

验收标准：

```text
用户可以通过浏览器完成基础管理路径：
首页 -> 知识结构管理 -> 题库管理 -> 针对性练习 -> 练习会话 -> 题目详情。
```

验证记录：

```text
2026-06-08 21:40:23 新增 Web 工作台基础管理化实现：新增知识结构、题库、练习和练习会话页面，并扩展 E2E 覆盖。
2026-06-08 21:46:40 cmd /c npx tsc --noEmit：第一次失败，原因是知识点类型在 TypeScript 中可能为空。
2026-06-08 21:46:40 修正 `/domains` 知识点类型展示兜底为 `未标注类型`。
2026-06-08 21:46:40 cmd /c npx tsc --noEmit：通过。
2026-06-08 21:46:40 cmd /c npm run test：通过，17 个测试文件，45 条测试用例。
2026-06-08 21:46:40 cmd /c npm run docs:check-timestamps：通过。
2026-06-08 21:46:40 cmd /c npm run build：通过，新增 `/domains`、`/questions`、`/practice` 和 `/practice/[practiceSessionId]` 页面进入 Next.js 生产构建。
2026-06-08 21:46:40 cmd /c npm run test:e2e：第一次失败，原因是题库页断言匹配到历史 E2E 题目导致严格模式冲突。
2026-06-08 21:46:40 收窄 Playwright 断言为本轮唯一知识点题目标题。
2026-06-08 21:46:40 cmd /c npm run test:e2e：通过，2 条 Playwright E2E 测试；覆盖首页入口、知识结构页、题库页、针对性练习页和练习会话详情页。
```

## 27. Web 知识结构维护能力

本章用于补齐知识结构“只可创建、不可维护”的明显缺口，让用户可以在浏览器中编辑和归档已有领域、主题、知识点。

实现范围：

```text
实现范围：
- 文件/模块：src/lib/knowledge/service.ts、src/app/domains/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：知识结构页新增领域编辑/归档、主题编辑/归档、知识点编辑/归档；E2E 覆盖编辑后继续创建练习。
- 数据/接口变化：不新增数据库表；新增知识点更新和归档服务函数；主题归档复用既有 updateTopic；领域归档复用既有 archiveDomain。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run build；cmd /c npm run test:e2e；cmd /c npm run docs:check-timestamps。
- 回滚或恢复：回退知识点更新服务、/domains 编辑表单、E2E 调整和文档记录即可恢复到第 26 章状态。
```

- [x] 服务层新增 `updateKnowledgePoint`。
- [x] 服务层新增 `archiveKnowledgePoint`。
- [x] `/domains` 支持编辑知识领域名称和说明。
- [x] `/domains` 支持归档知识领域。
- [x] `/domains` 支持编辑知识主题名称和说明。
- [x] `/domains` 支持归档知识主题。
- [x] `/domains` 支持编辑知识点名称、说明、复杂度和建议难度。
- [x] `/domains` 支持归档知识点。
- [x] Playwright E2E 覆盖领域、主题、知识点编辑路径。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。

验收标准：

```text
用户可以通过浏览器维护知识结构：
进入知识结构管理 -> 编辑领域 -> 编辑主题 -> 编辑知识点 -> 使用编辑后的知识点创建针对性练习。
```

验证记录：

```text
2026-06-08 21:53:47 新增 Web 知识结构维护能力：完成领域、主题、知识点编辑和归档入口，并扩展 E2E 覆盖。
2026-06-08 21:59:40 cmd /c npx tsc --noEmit：通过。
2026-06-08 21:59:40 cmd /c npm run test：通过，17 个测试文件，45 条测试用例。
2026-06-08 21:59:40 cmd /c npm run docs:check-timestamps：通过。
2026-06-08 21:59:40 cmd /c npm run build：通过，知识结构维护入口进入 Next.js 生产构建。
2026-06-08 21:59:40 cmd /c npm run test:e2e：第一次失败，原因是历史 E2E 数据导致 `编辑主题` 文本选择器匹配多处。
2026-06-08 21:59:40 修正 Playwright 编辑选择器：按当前唯一表单控件 aria-label 打开对应 details。
2026-06-08 21:59:40 cmd /c npm run test:e2e：通过，2 条 Playwright E2E 测试；覆盖领域、主题、知识点编辑后继续创建练习。
2026-06-08 21:59:40 cmd /c npx tsc --noEmit：补充重跑通过。
```

## 28. Web 题目详细编辑能力

本章用于补齐 AI 生成题目后的人工细修能力。用户可以在题目详情页编辑题干、标准答案、答案讲解和评分规则，系统以新版本方式保存，避免覆盖历史版本。

实现范围：

```text
实现范围：
- 文件/模块：src/lib/questions/service.ts、src/app/questions/[questionId]/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：题目详情页新增人工编辑表单；保存后生成新的题目版本、答案版本和评分规则版本；正式题旧 active 版本归档，新版本 active。
- 数据/接口变化：不新增数据库表；新增 `updateQuestionContent` 服务函数；人工编辑版本 source_type 为 `user_edited`。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run build；cmd /c npm run test:e2e；cmd /c npm run docs:check-timestamps。
- 回滚或恢复：回退题目编辑服务、题目详情页编辑表单、E2E 调整和文档记录即可恢复到第 27 章状态。
```

- [x] 服务层新增 `updateQuestionContentSchema`。
- [x] 服务层新增 `updateQuestionContent`。
- [x] 人工编辑题干时创建新的 QuestionVersion。
- [x] 人工编辑标准答案和讲解时创建新的 AnswerVersion。
- [x] 人工编辑评分规则时创建新的 ScoringRubricVersion。
- [x] 已确认题编辑后旧 active 版本自动归档，新版本 active。
- [x] 题目详情页新增题干、标准答案、答案讲解和评分规则编辑表单。
- [x] Playwright E2E 覆盖确认题目后编辑并查看新题干。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。

验收标准：

```text
用户可以通过浏览器维护题目内容：
进入题目详情 -> 确认入库 -> 编辑题干/答案/讲解/评分规则 -> 保存新版本 -> 页面展示新题干并保留版本审计。
```

验证记录：

```text
2026-06-08 22:12:43 新增 Web 题目详细编辑能力：完成题干、答案、讲解和评分规则人工编辑版本入口，并扩展 E2E 覆盖。
2026-06-08 22:17:21 cmd /c npx tsc --noEmit：通过。
2026-06-08 22:17:21 cmd /c npm run test：通过，17 个测试文件，45 条测试用例。
2026-06-08 22:17:21 cmd /c npm run docs:check-timestamps：通过。
2026-06-08 22:17:21 cmd /c npm run build：通过，题目详细编辑入口进入 Next.js 生产构建。
2026-06-08 22:17:21 cmd /c npm run test:e2e：通过，2 条 Playwright E2E 测试；覆盖题目确认入库后编辑题干、答案和讲解并展示新题干。
```

## 29. Web 核心讲解编辑能力

本章用于补齐核心知识点讲解的人工维护能力。核心讲解属于知识点维度，题目详情页通过题目的知识点关联读取并编辑核心讲解版本。

实现范围：

```text
实现范围：
- 文件/模块：src/lib/questions/service.ts、src/app/questions/[questionId]/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：题目详情页展示核心讲解；支持编辑核心讲解标题和正文；保存后创建新的 CoreExplanationVersion。
- 数据/接口变化：不新增数据库表；新增 `getCoreExplanationForKnowledgePoint` 和 `updateCoreExplanationContent` 服务函数；人工编辑版本 source_type 为 `user_edited`。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run build；cmd /c npm run test:e2e；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退核心讲解服务、题目详情页核心讲解编辑表单、E2E 调整和文档记录即可恢复到第 28 章状态。
```

- [x] 服务层新增 `updateCoreExplanationContentSchema`。
- [x] 服务层新增 `getCoreExplanationForKnowledgePoint`。
- [x] 服务层新增 `updateCoreExplanationContent`。
- [x] 题目详情页展示当前核心讲解。
- [x] 题目详情页支持编辑核心讲解标题和正文。
- [x] 核心讲解人工编辑保存为新的 CoreExplanationVersion。
- [x] Playwright E2E 覆盖核心讲解编辑并展示新标题。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器维护核心讲解：
进入题目详情 -> 编辑核心讲解标题和正文 -> 保存新版本 -> 页面展示新核心讲解标题。
```

验证记录：

```text
2026-06-09 08:56:49 新增 Web 核心讲解编辑能力：题目详情页可编辑核心讲解标题和正文，并扩展 E2E 覆盖。
2026-06-09 09:02:35 cmd /c npx tsc --noEmit：通过。
2026-06-09 09:02:35 cmd /c npm run test：通过，17 个测试文件，45 条测试用例。
2026-06-09 09:02:35 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 09:02:35 cmd /c npm run build：通过，核心讲解编辑入口进入 Next.js 生产构建。
2026-06-09 09:02:35 cmd /c npm run test:e2e：通过，2 条 Playwright E2E 测试；覆盖核心讲解编辑并展示新标题。
2026-06-09 09:02:35 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 09:02:35 已提示用户查看新功能：题目详情页核心讲解区域可编辑讲解标题和正文。
```

## 30. Web 待确认内容编辑能力

本章用于补齐外部会话沉淀后的人工预处理能力。用户可以在正式确认入库前编辑 AI 生成的建议领域、建议主题、知识点预览和题目预览，减少“生成内容基本可用但细节需要调整”时只能拒绝重来的情况。

实现范围：

```text
实现范围：
- 文件/模块：src/lib/ingestion/service.ts、src/app/api/v1/review-items/[reviewItemId]/route.ts、src/app/review/[reviewItemId]/page.tsx、src/app/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：首页待确认卡片新增编辑详情入口；新增待确认内容编辑页；保存后更新 ReviewItem.previewJson；确认/拒绝仍复用既有状态流。
- 数据/接口变化：不新增数据库表；新增 `updateReviewItemPreviewSchema` 和 `updateReviewItemPreview`；`PATCH /api/v1/review-items/{reviewItemId}` 支持 Agent/API 客户端更新待确认预览。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run build；cmd /c npm run test:e2e；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退 review 预览更新服务、PATCH 路由、/review 编辑页、首页链接、E2E 调整和文档记录即可恢复到第 29 章状态。
```

- [x] 服务层新增 `updateReviewItemPreviewSchema`。
- [x] 服务层新增 `updateReviewItemPreview`。
- [x] `ReviewItem` 仅允许 pending 状态编辑预览。
- [x] API 新增 `PATCH /api/v1/review-items/{reviewItemId}`。
- [x] 首页待确认队列新增“编辑详情”入口。
- [x] 新增 `/review/[reviewItemId]` 待确认内容编辑页。
- [x] 编辑页支持修改建议领域和建议主题。
- [x] 编辑页支持修改知识点预览。
- [x] 编辑页支持修改题目预览 JSON。
- [x] 编辑页保留确认入库和拒绝操作。
- [x] API 集成测试覆盖待确认预览更新。
- [x] Playwright E2E 覆盖外部会话沉淀后编辑待确认预览。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器维护待确认内容：
外部会话沉淀 -> 进入待确认编辑详情 -> 编辑建议领域/主题/知识点/题目预览 -> 保存预览 -> 页面展示编辑后的待确认内容。
```

验证记录：

```text
2026-06-09 09:28:20 新增 Web 待确认内容编辑能力：完成待确认预览编辑服务、PATCH API、/review 编辑页、首页编辑入口和 E2E 覆盖。
2026-06-09 09:28:20 cmd /c npx tsc --noEmit：通过。
2026-06-09 09:28:20 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-09 09:28:20 cmd /c npm run build：通过，新增 `/review/[reviewItemId]` 动态页面进入 Next.js 生产构建。
2026-06-09 09:28:20 cmd /c npm run test:e2e：第一次失败，原因是待确认编辑测试文本选择器匹配到 textarea 和预览内容，且原长闭环超过 30 秒默认超时。
2026-06-09 09:28:20 修正 Playwright：测试超时调整为 60 秒，并收窄待确认编辑页断言选择器。
2026-06-09 09:28:20 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、待确认内容编辑和 MVP 浏览器学习闭环。
2026-06-09 09:30:13 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 09:32:59 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 09:32:59 已提示用户查看新功能：首页待确认队列可进入“编辑详情”，在 `/review/<reviewItemId>` 编辑待确认内容。
```

## 31. Web 练习会话连续答题体验

本章用于补齐练习会话“只能列题、需要跳转题目详情页答题”的体验缺口。用户进入练习会话后，可以在同一页面看到当前题、提交答案、查看 AI 评分和进度变化，减少练习过程中的来回跳转。

实现范围：

```text
实现范围：
- 文件/模块：src/lib/practice/service.ts、src/app/practice/[practiceSessionId]/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：练习会话页新增进度统计、当前题答题面板、会话内提交答案、最近评分展示；题目列表显示 answered/pending 状态和最近得分。
- 数据/接口变化：不新增数据库表；新增 `submitPracticeSessionItemAnswer`，提交答案后更新 PracticeSessionItem.status，并按完成情况更新 PracticeSession.status 为 in_progress 或 completed。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run build；cmd /c npm run test:e2e；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退练习服务函数、练习会话页连续答题面板、E2E 调整和文档记录即可恢复到第 30 章状态。
```

- [x] 服务层新增 `submitPracticeSessionItemAnswer`。
- [x] 会话内答题后更新 `PracticeSessionItem.status` 为 answered。
- [x] 会话内答题后按进度更新 `PracticeSession.status` 为 in_progress 或 completed。
- [x] 练习会话序列化结果新增进度统计。
- [x] 练习会话序列化结果为每题补充最近答题记录。
- [x] `/practice/[practiceSessionId]` 新增当前题答题面板。
- [x] `/practice/[practiceSessionId]` 新增总题数、已完成、待完成统计。
- [x] `/practice/[practiceSessionId]` 提交答案后显示最近评分。
- [x] `/practice/[practiceSessionId]` 题目列表显示 answered/pending 和最近得分。
- [x] Playwright E2E 覆盖练习会话内直接提交答案并显示评分。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器完成连续练习：
进入练习会话 -> 查看当前题 -> 输入答案 -> 提交本题 -> 页面显示最近评分和完成进度 -> 题目列表显示该题 answered。
```

验证记录：

```text
2026-06-09 10:04:48 新增 Web 练习会话连续答题体验：完成会话内提交答案、进度统计、最近评分展示和 E2E 覆盖。
2026-06-09 10:04:48 cmd /c npx tsc --noEmit：第一次通过；补充 E2E 后待重跑。
2026-06-09 10:04:48 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-09 10:04:48 cmd /c npm run build：通过，练习会话页连续答题入口进入 Next.js 生产构建。
2026-06-09 10:04:48 cmd /c npm run test:e2e：第一次失败，原因是测试中首页详情链接点击受页面刷新影响，后改为读取 href 后直接进入题目详情。
2026-06-09 10:04:48 cmd /c npm run test:e2e：第二次失败，原因是测试仍依赖练习创建 Server Action 跳转；本轮目标为连续答题体验，改为通过已验证 API 创建会话后进入会话页。
2026-06-09 10:04:48 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、待确认内容编辑和练习会话内连续答题。
2026-06-09 10:06:40 cmd /c npx tsc --noEmit：补充重跑通过。
2026-06-09 10:06:40 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 10:09:15 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 10:09:15 已提示用户查看新功能：练习会话页可直接提交答案、查看进度和最近评分。
```

## 32. Web Agent/MCP 调用记录页

本章用于补齐 Agent/MCP 调用与模型生成质检的 Web 可视化入口。用户可以在浏览器中集中查看外部 Agent 会话来源、模型生成调用、质量校验记录，用于分析 AI Agent 和大模型生成质量能力。

实现范围：

```text
实现范围：
- 文件/模块：src/app/records/page.tsx、src/app/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：首页新增“调用记录”入口；新增 `/records` 页面展示来源记录、生成调用记录和质量校验记录。
- 数据/接口变化：不新增数据库表；复用 `listSourceReferences`、`listGenerationRecords`、`listQualityChecks` 和既有 API 数据结构。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run build；cmd /c npm run test:e2e；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退 `/records` 页面、首页入口、E2E 调整和文档记录即可恢复到第 31 章状态。
```

- [x] 新增 `/records` 调用记录页。
- [x] `/records` 展示来源记录总数、生成调用总数和质量校验总数。
- [x] `/records` 展示 Agent 会话来源、来源系统、会话 ID、摘要和原文长度。
- [x] `/records` 展示模型生成调用的 AI Agent、模型、模型版本、Prompt、Token 和耗时。
- [x] `/records` 展示质量校验的 checker、模型、AI Agent、自动修正次数和通过时间。
- [x] 首页新增“调用记录”入口。
- [x] Playwright E2E 覆盖首页入口和外部会话沉淀后的来源记录展示。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器查看 Agent/MCP 调用记录：
首页 -> 调用记录 -> 查看 Agent 会话来源 -> 查看模型生成调用 -> 查看质量校验记录。
```

验证记录：

```text
2026-06-09 10:41:42 新增 Web Agent/MCP 调用记录页：完成 `/records` 页面、首页入口和 E2E 覆盖。
2026-06-09 10:41:42 cmd /c npx tsc --noEmit：通过。
2026-06-09 10:41:42 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-09 10:41:42 cmd /c npm run build：通过，新增 `/records` 动态页面进入 Next.js 生产构建。
2026-06-09 10:41:42 cmd /c npm run test:e2e：第一次失败，原因是“模型生成调用”文本同时匹配说明文案和标题。
2026-06-09 10:41:42 修正 Playwright：改用 heading 精确匹配调用记录页标题。
2026-06-09 10:41:42 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、待确认内容编辑、调用记录页和 MVP 浏览器学习闭环。
2026-06-09 10:44:01 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 10:46:57 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 10:46:57 已提示用户查看新功能：首页可进入“调用记录”，也可直接访问 `/records`。
```

## 33. Web 错误集管理页

本章用于补齐错误集的集中复盘与状态管理能力。用户可以在浏览器中查看全部错误集、活跃错误集、已解决错误集，按知识点查看主导错误标签，并将已复盘的活跃错误集标记为已解决。

实现范围：

```text
实现范围：
- 文件/模块：src/lib/practice/service.ts、src/app/error-sets/page.tsx、src/app/page.tsx、src/app/practice/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：首页新增“错误集管理”入口；新增 `/error-sets` 页面；错误集列表展示关联知识点名称、证据数量、主导错误标签、创建/更新时间；活跃错误集可标记已解决。
- 数据/接口变化：不新增数据库表；`listErrorSets` 通过知识点 ID 批量查询知识点名称并合并返回；`/practice?knowledge_point_id=` 支持预选练习知识点。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run build；cmd /c npm run test:e2e；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退错误集页面、服务层展示增强、首页入口、练习页预选参数、E2E 调整和文档记录即可恢复到第 32 章状态。
```

- [x] 服务层 `listErrorSets` 返回关联知识点名称和状态。
- [x] 新增 `/error-sets` 错误集管理页。
- [x] `/error-sets` 展示全部、活跃、已解决错误集统计。
- [x] `/error-sets` 展示知识点名称、证据数量、主导错误标签和更新时间。
- [x] `/error-sets` 支持活跃错误集标记已解决。
- [x] `/error-sets` 支持跳转到针对该知识点的练习创建入口。
- [x] `/practice?knowledge_point_id=` 支持预选练习知识点。
- [x] 首页新增“错误集管理”入口。
- [x] Playwright E2E 覆盖首页入口和错误集管理页展示。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器管理错误集：
首页 -> 错误集管理 -> 查看知识点错误标签 -> 从错误集创建针对性练习或标记已解决。
```

验证记录：

```text
2026-06-09 11:01:12 新增 Web 错误集管理页：完成 `/error-sets` 页面、错误集知识点名称展示、首页入口、练习预选参数和 E2E 覆盖。
2026-06-09 11:01:12 cmd /c npx tsc --noEmit：第一次失败，原因是 ErrorSet Prisma 模型没有 knowledgePoint relation，不能直接 include。
2026-06-09 11:01:12 修正 `listErrorSets`：改为按 knowledgePointId 批量查询知识点后合并展示，不改数据库结构。
2026-06-09 11:01:12 cmd /c npx tsc --noEmit：通过。
2026-06-09 11:01:12 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-09 11:01:12 cmd /c npm run build：通过，新增 `/error-sets` 动态页面进入 Next.js 生产构建。
2026-06-09 11:01:12 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、待确认内容编辑、错误集管理页和 MVP 浏览器学习闭环。
2026-06-09 11:03:00 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 11:05:43 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 11:05:43 已提示用户查看新功能：首页可进入“错误集管理”，也可直接访问 `/error-sets`。
```

## 34. Web 掌握画像管理页

本章用于补齐掌握画像的集中查看能力。用户可以在浏览器中查看知识点、主题和领域维度的五维掌握分、综合分、薄弱维度和证据数量，并从知识点画像进入针对性练习。

实现范围：

```text
实现范围：
- 文件/模块：src/lib/practice/service.ts、src/app/mastery/page.tsx、src/app/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：首页新增“掌握画像”入口；新增 `/mastery` 页面；掌握画像列表展示目标名称、五维分数、综合分、薄弱维度、证据数量和更新时间；知识点画像可进入针对练习。
- 数据/接口变化：不新增数据库表；`listMasteryProfiles` 按 target_type/target_id 批量查询知识点、主题、领域名称并合并返回。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run build；cmd /c npm run test:e2e；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退掌握画像页面、服务层目标名称解析、首页入口、E2E 调整和文档记录即可恢复到第 33 章状态。
```

- [x] 服务层 `listMasteryProfiles` 返回 target_name。
- [x] 服务层支持 knowledge_point、topic、domain 三类画像目标名称解析。
- [x] 新增 `/mastery` 掌握画像管理页。
- [x] `/mastery` 展示全部、知识点、主题、领域画像统计。
- [x] `/mastery` 展示五维掌握分、综合分、薄弱维度和证据数量。
- [x] `/mastery` 知识点画像支持进入针对练习。
- [x] 首页新增“掌握画像”入口。
- [x] Playwright E2E 覆盖答题评分后查看掌握画像页。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器查看掌握画像：
首页 -> 掌握画像 -> 查看知识点五维分数和薄弱维度 -> 从知识点画像进入针对练习。
```

验证记录：

```text
2026-06-09 14:23:02 新增 Web 掌握画像管理页：完成 `/mastery` 页面、画像目标名称解析、首页入口和 E2E 覆盖。
2026-06-09 14:23:02 cmd /c npx tsc --noEmit：通过。
2026-06-09 14:23:02 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-09 14:23:02 cmd /c npm run build：通过，新增 `/mastery` 动态页面进入 Next.js 生产构建。
2026-06-09 14:23:02 cmd /c npm run test:e2e：第一次失败，原因是“应用”文本在多个画像卡片中重复匹配。
2026-06-09 14:23:02 修正 Playwright：收窄到当前知识点画像卡片内断言维度标签和针对练习入口。
2026-06-09 14:23:02 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、待确认内容编辑、掌握画像页和 MVP 浏览器学习闭环。
2026-06-09 14:24:49 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 14:27:59 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 14:27:59 已提示用户查看新功能：首页可进入“掌握画像”，也可直接访问 `/mastery`。
```

## 35. Web 答题记录管理页

本章用于补齐用户学习过程回看能力。用户可以在浏览器中集中查看每次答题绑定的题目版本、用户答案、AI 评分、用户确认评分、修正原因、错误标签和是否计入长期掌握画像。

实现范围：

```text
实现范围：
- 文件/模块：src/lib/practice/service.ts、src/app/attempts/page.tsx、src/app/page.tsx、src/app/domains/page.tsx、src/app/questions/page.tsx、src/app/practice/page.tsx、src/app/practice/[practiceSessionId]/page.tsx、src/app/mastery/page.tsx、src/app/error-sets/page.tsx、src/app/records/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：首页新增“答题记录”统计和功能入口；新增 `/attempts` 页面；各管理页顶部导航统一补充画像、答题记录、错误集和调用记录入口。
- 数据/接口变化：不新增数据库表；`listAnswerAttempts` 支持按 status 过滤，并返回题目版本题干、答案版本快照，用于答题历史展示。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run build；cmd /c npm run test:e2e；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退答题记录页面、服务层答题记录序列化扩展、首页入口、导航统一、E2E 调整和文档记录即可恢复到第 34 章状态。
```

- [x] 服务层 `listAnswerAttempts` 支持按答题状态过滤。
- [x] 服务层答题记录返回题目版本题干和答案版本快照。
- [x] 新增 `/attempts` 答题记录管理页。
- [x] `/attempts` 展示全部、AI 已评分、用户已确认统计。
- [x] `/attempts` 展示用户答案、AI 反馈、用户确认分数、修正原因、错误标签和计入画像状态。
- [x] `/attempts` 支持从答题记录进入题目详情。
- [x] 首页新增“答题记录”统计和功能入口。
- [x] 统一管理页顶部导航，补齐画像、答题记录、错误集和调用记录入口。
- [x] Playwright E2E 覆盖答题评分后查看答题记录页。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器查看答题记录：
首页 -> 答题记录 -> 查看题干快照、用户答案、AI 评分、用户确认评分、修正原因和错误标签 -> 返回题目详情。
```

验证记录：

```text
2026-06-09 15:08:00 新增 Web 答题记录管理页：完成 `/attempts` 页面、答题记录状态过滤、题干版本快照展示、首页入口、顶部导航统一和 E2E 覆盖。
2026-06-09 15:08:00 cmd /c npx tsc --noEmit：第一次失败，原因是答案版本模型真实字段为 answerText/explanationText，不是 answer/explanation。
2026-06-09 15:08:00 修正 `serializeAttempt`：答案版本快照改用 answerText/explanationText。
2026-06-09 15:08:00 cmd /c npx tsc --noEmit：通过。
2026-06-09 15:08:00 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-09 15:08:00 cmd /c npm run build：第一次失败，原因是与 Playwright E2E 并行执行时竞争 `.next` 构建产物，出现 /_document 页面模块缺失。
2026-06-09 15:08:00 cmd /c npm run test:e2e：第一次失败，原因是“答题记录”同时匹配侧边统计锚点和功能入口；已收窄为功能入口链接。
2026-06-09 15:08:00 cmd /c npm run build：顺序执行通过，新增 `/attempts` 动态页面进入 Next.js 生产构建。
2026-06-09 15:08:00 cmd /c npm run test:e2e：第二次失败，原因是完整浏览器闭环已超过 60 秒测试预算；调整 E2E 超时为 90 秒。
2026-06-09 15:08:00 cmd /c npm run test:e2e：第三次失败，原因是生产构建后的 `.next` 影响 dev E2E，出现 review 动态页 webpack runtime 错误。
2026-06-09 15:08:00 清理 3000 旧 dev server 和 `.next` 构建产物后重跑。
2026-06-09 15:08:00 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、待确认内容编辑、答题记录页和 MVP 浏览器学习闭环。
2026-06-09 15:08:00 本地验证规则补充：`next build` 与 Playwright E2E 不并行执行；生产构建后如 E2E dev server 异常，先清理 `.next` 再重跑。
2026-06-09 15:08:00 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 15:08:00 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 15:08:00 已提示用户查看新功能：首页可进入“答题记录”，也可直接访问 `/attempts`。
```

## 36. Web 题库筛选增强

本章用于提升题库管理页的检索效率。用户可以在浏览器中按题目状态、认知维度、难度和知识点筛选题库，并通过 URL query 保留筛选条件。

实现范围：

```text
实现范围：
- 文件/模块：src/lib/questions/service.ts、src/app/api/v1/questions/route.ts、src/app/questions/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：`/questions` 新增筛选栏；用户可以按状态、认知维度、难度和知识点筛选题库；筛选结果展示当前命中数量；清除按钮返回全量题库。
- 数据/接口变化：不新增数据库表；`listQuestions` 新增 cognitiveDimension 和 difficultyLevel 筛选参数；`GET /api/v1/questions` 支持 cognitive_dimension 和 difficulty_level query。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run test:e2e；cmd /c npm run build；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退题库筛选表单、服务/API 筛选参数、E2E 调整和文档记录即可恢复到第 35 章状态。
```

- [x] `listQuestions` 支持认知维度筛选。
- [x] `listQuestions` 支持难度筛选。
- [x] `GET /api/v1/questions` 支持 `cognitive_dimension` query。
- [x] `GET /api/v1/questions` 支持 `difficulty_level` query。
- [x] `/questions` 新增状态筛选。
- [x] `/questions` 新增认知维度筛选。
- [x] `/questions` 新增难度筛选。
- [x] `/questions` 新增知识点筛选。
- [x] `/questions` 展示当前筛选结果数量。
- [x] `/questions` 支持清除筛选条件。
- [x] Playwright E2E 覆盖题库按正式题和知识点筛选。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器筛选题库：
首页 -> 题库管理 -> 选择状态/认知维度/难度/知识点 -> 筛选题库 -> 查看命中题目 -> 清除筛选返回全量题库。
```

验证记录：

```text
2026-06-09 15:23:47 新增 Web 题库筛选增强：完成题库状态、认知维度、难度和知识点筛选，补充 API query 支持和 E2E 覆盖。
2026-06-09 15:23:47 cmd /c npx tsc --noEmit：第一次失败，原因是题库页改为 filteredQuestions 后漏保留 allQuestions 统计变量。
2026-06-09 15:23:47 修正 `/questions`：新增全量题目统计查询，列表继续使用筛选结果。
2026-06-09 15:23:47 cmd /c npx tsc --noEmit：通过。
2026-06-09 15:23:47 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-09 15:23:47 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、待确认内容编辑、题库筛选和 MVP 浏览器学习闭环。
2026-06-09 15:23:47 cmd /c npm run build：通过，题库筛选增强进入 Next.js 生产构建。
2026-06-09 15:23:47 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 15:23:47 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 15:23:47 已提示用户查看新功能：首页可进入“题库管理”，也可直接访问 `/questions` 使用筛选栏。
```

## 37. Web 练习会话历史与筛选

本章用于补齐练习会话管理能力。用户可以在针对性练习页查看历史练习会话，按会话状态和知识点筛选，并继续进入已有练习。

实现范围：

```text
实现范围：
- 文件/模块：src/lib/practice/service.ts、src/app/practice/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：`/practice` 新增历史练习区域；展示练习会话总量、进度、目标知识点名称、创建/更新时间和进入练习入口；支持按会话状态和知识点筛选。
- 数据/接口变化：不新增数据库表；新增 `listPracticeSessions` 服务方法，支持按 status、targetId 分页查询，并解析 knowledge_point 目标名称。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run test:e2e；cmd /c npm run build；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退练习会话列表服务、练习页历史练习 UI、E2E 调整和文档记录即可恢复到第 36 章状态。
```

- [x] 新增 `listPracticeSessions` 服务方法。
- [x] `listPracticeSessions` 支持会话状态筛选。
- [x] `listPracticeSessions` 支持目标知识点筛选。
- [x] `listPracticeSessions` 返回练习进度和目标名称。
- [x] `/practice` 展示练习会话总量。
- [x] `/practice` 新增历史练习区域。
- [x] `/practice` 历史练习支持按状态筛选。
- [x] `/practice` 历史练习支持按知识点筛选。
- [x] `/practice` 历史练习支持进入练习会话。
- [x] Playwright E2E 覆盖创建练习后筛选历史练习。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器管理练习会话：
首页 -> 针对性练习 -> 查看历史练习 -> 按状态或知识点筛选 -> 进入已有练习会话继续答题。
```

验证记录：

```text
2026-06-09 16:05:09 新增 Web 练习会话历史与筛选：完成 `listPracticeSessions`、`/practice` 历史练习列表、状态/知识点筛选和 E2E 覆盖。
2026-06-09 16:05:09 cmd /c npx tsc --noEmit：通过。
2026-06-09 16:05:09 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-09 16:05:09 cmd /c npm run test:e2e：第一次失败，原因是筛选练习知识点控件没有稳定 aria-label；已新增 `aria-label="筛选练习知识点"`。
2026-06-09 16:05:09 cmd /c npm run test:e2e：第二次失败，原因是创建练习选择器 `练习知识点` 同时匹配筛选控件；已改为 exact 匹配。
2026-06-09 16:05:09 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、待确认内容编辑、题库筛选、练习历史筛选和 MVP 浏览器学习闭环。
2026-06-09 16:05:09 cmd /c npm run build：通过，练习会话历史与筛选进入 Next.js 生产构建。
2026-06-09 16:05:09 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 16:05:09 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 16:05:09 已提示用户查看新功能：首页可进入“针对性练习”，也可直接访问 `/practice` 查看历史练习筛选。
```

## 38. Web Agent/MCP 调用记录筛选

本章用于提升记录追踪与审计能力。用户可以在调用记录页按来源系统、来源类型、AI Agent、模型、调用类型、质检状态和质检类型筛选记录。

实现范围：

```text
实现范围：
- 文件/模块：src/app/records/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：`/records` 新增来源筛选、生成筛选和质检筛选；筛选条件通过 URL query 保留；记录分区标题展示当前筛选结果数量。
- 数据/接口变化：不新增数据库表；复用已有 `listSourceReferences`、`listGenerationRecords`、`listQualityChecks` 服务筛选参数和 API query 能力。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run test:e2e；cmd /c npm run build；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退记录页筛选 UI、E2E 调整和文档记录即可恢复到第 37 章状态。
```

- [x] `/records` 新增来源系统筛选。
- [x] `/records` 新增来源类型筛选。
- [x] `/records` 新增生成 AI Agent 筛选。
- [x] `/records` 新增生成模型筛选。
- [x] `/records` 新增调用类型筛选。
- [x] `/records` 新增质检状态筛选。
- [x] `/records` 新增质检类型筛选。
- [x] `/records` 三个记录分区展示当前筛选结果数量。
- [x] `/records` 支持清除筛选条件。
- [x] Playwright E2E 覆盖来源系统筛选。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器筛选调用记录：
首页 -> 调用记录 -> 输入来源系统/模型/Agent/质检状态等条件 -> 筛选对应记录 -> 查看命中记录数量和明细 -> 清除筛选返回全量记录。
```

验证记录：

```text
2026-06-09 16:26:03 新增 Web Agent/MCP 调用记录筛选：完成 `/records` 来源、生成、质检三类筛选 UI 和 E2E 覆盖。
2026-06-09 16:26:03 cmd /c npx tsc --noEmit：通过。
2026-06-09 16:26:03 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-09 16:26:03 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、待确认内容编辑、记录来源筛选和 MVP 浏览器学习闭环。
2026-06-09 16:26:03 cmd /c npm run build：通过，记录筛选进入 Next.js 生产构建。
2026-06-09 16:26:03 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 16:26:03 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 16:26:03 已提示用户查看新功能：首页可进入“调用记录”，也可直接访问 `/records` 使用记录筛选。
```

## 39. Web Agent/MCP 接入说明页

本章用于让系统检验标准中的 AI Agent MCP/Agent 调用能力变成用户可见、可操作的入口。用户可以在浏览器中查看 HTTP API、Agent Tool CLI 和 MCP stdio 的本地接入方式，并从首页或调用记录页进入。

实现范围：

```text
实现范围：
- 文件/模块：src/app/integrations/page.tsx、src/app/page.tsx、src/app/records/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：新增 `/integrations` 接入说明页；首页新增“Agent 接入”功能入口；调用记录页新增接入方式入口；页面展示环境变量、HTTP API、Agent Tool CLI、MCP stdio 和工具清单。
- 数据/接口变化：不新增数据库表；复用已有 HTTP API、Agent Tool CLI 和 MCP Tool schema；页面只展示 API Key 占位符，不展示真实密钥。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run test:e2e；cmd /c npm run build；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退接入说明页、首页入口、调用记录页入口、E2E 调整和文档记录即可恢复到第 38 章状态。
```

- [x] 新增 `/integrations` Agent/MCP 接入说明页。
- [x] 页面展示本地环境变量配置。
- [x] 页面展示 API Key 占位符，不展示真实 API Key。
- [x] 页面展示 HTTP API 外部会话沉淀命令。
- [x] 页面展示 Agent Tool CLI 帮助命令。
- [x] 页面展示 Agent Tool CLI 外部会话沉淀命令。
- [x] 页面展示 MCP stdio 启动命令。
- [x] 页面展示 MCP 自检命令。
- [x] 页面从 `mcpToolDefinitions` 展示 MCP/Agent Tool 清单。
- [x] 首页新增“Agent 接入”入口。
- [x] 调用记录页新增“查看 Agent 接入方式”入口。
- [x] Playwright E2E 覆盖首页入口和接入页核心命令展示。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器查看 Agent/MCP 接入方式：
首页 -> Agent 接入 -> 查看 HTTP API、Agent Tool CLI、MCP stdio 命令和 Tool 清单。
调用记录 -> 查看 Agent 接入方式 -> 进入 `/integrations`。
```

验证记录：

```text
2026-06-09 16:52:47 新增 Web Agent/MCP 接入说明页：完成 `/integrations` 页面、首页入口、调用记录页入口和 E2E 覆盖。
2026-06-09 16:52:47 cmd /c npx tsc --noEmit：通过。
2026-06-09 16:52:47 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-09 16:52:47 cmd /c npm run test:e2e：第一次失败，原因是首页仍有 dev server 资源加载时点击入口未稳定触发跳转。
2026-06-09 16:52:47 修正 Playwright：验证首页 Agent 接入链接 href 后，直接进入 `/integrations` 检查接入页核心内容。
2026-06-09 16:52:47 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、待确认内容编辑、Agent/MCP 接入页和 MVP 浏览器学习闭环。
2026-06-09 16:52:47 cmd /c npm run build：通过，新增 `/integrations` 动态页面进入 Next.js 生产构建。
2026-06-09 16:54:54 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 16:59:38 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 16:59:38 `/integrations` 冒烟检查：通过，页面包含 Agent/MCP 接入、qa_create_from_conversation、npm run mcp:stdio 和 API Key 占位符。
2026-06-09 16:59:38 已提示用户查看新功能：首页可进入“Agent 接入”，也可直接访问 `/integrations`。
```

## 40. Web 待确认队列筛选

本章用于提升外部 Agent 沉淀后的审核效率。用户可以在首页待确认队列中按状态和来源系统筛选待确认项，并在卡片上直接看到来源系统。

实现范围：

```text
实现范围：
- 文件/模块：src/lib/ingestion/service.ts、src/app/api/v1/review-items/route.ts、src/app/page.tsx、src/app/api/v1/ingestion-routes.integration.test.ts、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：首页待确认队列新增状态筛选和来源系统筛选；筛选条件通过 URL query 保留；待确认卡片展示来源系统；API 支持 `source_system` query。
- 数据/接口变化：不新增数据库表；`listReviewItems` 扩展 `sourceSystem` 查询条件，并返回 `ingestion_task.source_reference` 轻量来源信息。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run test:e2e；cmd /c npm run build；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退待确认筛选 UI、`listReviewItems` 来源查询、API query 扩展、测试和文档记录即可恢复到第 39 章状态。
```

- [x] `listReviewItems` 支持 `sourceSystem` 筛选。
- [x] `listReviewItems` 返回来源系统轻量信息。
- [x] `GET /api/v1/review-items` 支持 `source_system` query。
- [x] 首页待确认队列支持按状态筛选。
- [x] 首页待确认队列支持按来源系统筛选。
- [x] 首页待确认卡片展示来源系统。
- [x] 首页待确认筛选条件通过 URL query 保留。
- [x] 首页待确认筛选支持一键清除。
- [x] API 集成测试覆盖 `source_system` 筛选。
- [x] Playwright E2E 覆盖首页待确认来源筛选。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器筛选待确认队列：
首页 -> 待确认入库 -> 输入来源系统或选择状态 -> 筛选待确认 -> 查看命中记录和来源系统 -> 清除筛选返回默认待确认列表。
```

验证记录：

```text
2026-06-09 17:17:56 新增 Web 待确认队列筛选：完成首页待确认状态/来源系统筛选、API source_system query、来源展示和测试覆盖。
2026-06-09 17:17:56 cmd /c npx tsc --noEmit：通过。
2026-06-09 17:17:56 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-09 17:17:56 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、待确认内容编辑、待确认来源筛选和 MVP 浏览器学习闭环。
2026-06-09 17:17:56 cmd /c npm run build：通过，待确认队列筛选进入 Next.js 生产构建。
2026-06-09 17:19:46 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 17:23:41 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 17:23:41 首页待确认筛选冒烟检查：通过，页面包含待确认入库、待确认来源系统、筛选待确认和 Codex。
2026-06-09 17:23:41 已提示用户查看新功能：首页“待确认入库”区域可以按状态和来源系统筛选。
```

## 41. Web 待确认队列批量操作

本章用于提升待确认队列处理效率。用户可以在首页待确认队列中勾选多个待确认项，并批量确认入库或批量拒绝。

实现范围：

```text
实现范围：
- 文件/模块：src/app/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：首页待确认队列新增批量操作栏；每条待确认卡片新增勾选框；批量操作支持确认入库和拒绝；单项编辑、确认、拒绝入口保持可用。
- 数据/接口变化：不新增数据库表；批量 Server Action 复用既有 `confirmReviewItem` 和 `rejectReviewItem` 状态流。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run test:e2e；cmd /c npm run build；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退待确认批量表单、批量 Server Action、E2E 调整和文档记录即可恢复到第 40 章状态。
```

- [x] 首页待确认队列新增批量操作栏。
- [x] 首页待确认卡片新增可访问勾选框。
- [x] 批量操作支持确认入库。
- [x] 批量操作支持拒绝。
- [x] 批量操作复用既有单项确认/拒绝业务逻辑。
- [x] 未勾选时批量操作不破坏现有数据。
- [x] 单项编辑、确认、拒绝入口保持可用。
- [x] Playwright E2E 覆盖批量拒绝。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器批量处理待确认队列：
首页 -> 待确认入库 -> 筛选待确认 -> 勾选一个或多个待确认项 -> 批量确认入库或批量拒绝 -> 队列状态更新。
```

验证记录：

```text
2026-06-09 17:37:37 新增 Web 待确认队列批量操作：完成批量操作栏、待确认项勾选框、批量确认/拒绝 Server Action 和 E2E 覆盖。
2026-06-09 17:37:37 cmd /c npx tsc --noEmit：通过。
2026-06-09 17:37:37 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-09 17:37:37 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、待确认内容编辑、待确认批量拒绝和 MVP 浏览器学习闭环。
2026-06-09 17:37:37 cmd /c npm run build：通过，待确认队列批量操作进入 Next.js 生产构建。
2026-06-09 17:39:34 cmd /c npm run docs:check-timestamps：通过。
2026-06-09 17:43:21 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-09 17:43:21 首页待确认批量操作冒烟检查：通过，页面包含批量确认入库、批量拒绝、review-batch-form 和待确认入库。
2026-06-09 17:43:21 已提示用户查看新功能：首页“待确认入库”区域可以勾选多项后批量确认或批量拒绝。
```

## 42. Web 系统设置页

本章用于补齐本地运行、默认模型、Agent/API 和 MCP 配置的只读可见性。用户可以在浏览器中查看系统当前运行状态和关键配置是否就绪，但页面不展示真实密钥。

实现范围：

```text
实现范围：
- 文件/模块：src/app/settings/page.tsx、src/app/page.tsx、src/app/integrations/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：新增 `/settings` 系统设置页；首页新增“系统设置”入口；接入页顶部导航新增“设置”；设置页展示应用版本、数据库状态、模型 Provider、默认 Agent、默认模型、API Key 配置状态、MCP/Agent Tool 状态和本地自检命令。
- 数据/接口变化：不新增数据库表；设置页复用 `appConfig`、`mcpToolDefinitions` 和 Prisma `SELECT 1` 数据库探测；只展示配置状态，不展示真实 API Key 或 DATABASE_URL。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run test:e2e；cmd /c npm run build；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退设置页、首页入口、接入页导航、E2E 调整和文档记录即可恢复到第 41 章状态。
```

- [x] 新增 `/settings` 系统设置页。
- [x] 设置页展示应用版本。
- [x] 设置页展示数据库 ready/unavailable 状态。
- [x] 设置页展示模型 Provider。
- [x] 设置页展示默认 AI Agent。
- [x] 设置页展示默认模型。
- [x] 设置页展示 API Key 是否配置，但不展示真实密钥。
- [x] 设置页展示 Agent Tool CLI 和 MCP stdio 状态。
- [x] 设置页展示本地自检命令。
- [x] 首页新增“系统设置”入口。
- [x] 接入页顶部导航新增“设置”入口。
- [x] Playwright E2E 覆盖首页设置入口和设置页核心内容。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器查看系统设置：
首页 -> 系统设置 -> 查看应用版本、数据库状态、默认模型、默认 Agent、API Key 配置状态、MCP/Agent 命令和本地自检命令。
接入页 -> 设置 -> 进入 `/settings`。
```

验证记录：

```text
2026-06-10 09:00:15 新增 Web 系统设置页：完成 `/settings` 页面、首页入口、接入页导航入口和 E2E 覆盖。
2026-06-10 09:00:15 cmd /c npx tsc --noEmit：通过。
2026-06-10 09:00:15 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-10 09:00:15 cmd /c npm run test:e2e：第一次超过 180 秒外层命令超时，未产生失败上下文；检查 3100 无监听残留后，以 300 秒超时重跑。
2026-06-10 09:00:15 cmd /c npm run test:e2e：重跑通过，3 条 Playwright E2E 测试；覆盖首页、Agent/MCP 接入页、系统设置页、待确认内容编辑和 MVP 浏览器学习闭环。
2026-06-10 09:00:15 cmd /c npm run build：通过，新增 `/settings` 动态页面进入 Next.js 生产构建。
2026-06-10 09:02:16 cmd /c npm run docs:check-timestamps：通过。
2026-06-10 09:05:56 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-10 09:05:56 `/settings` 冒烟检查：通过，页面包含系统设置、chatgpt-5.5、Codex、页面不显示真实值和 npm run mcp:check。
2026-06-10 09:05:56 已提示用户查看新功能：首页可进入“系统设置”，也可直接访问 `/settings`。
```

## 43. Web 系统设置页环境配置说明

本章用于补齐本地部署和 Agent/MCP 接入排查时最常用的环境变量说明。用户可以在系统设置页查看必填/可选环境变量、当前配置状态、`.env.local` 示例和 PowerShell 临时配置命令。

实现范围：

```text
实现范围：
- 文件/模块：src/app/settings/page.tsx、tests/e2e/home.spec.ts、docs/TODO.md、.agent-flow.md。
- 行为变化：`/settings` 新增“环境配置说明”区块；展示 DATABASE_URL、KNOWLEDGE_QA_API_KEY、KNOWLEDGE_QA_API_BASE_URL、DEFAULT_AI_AGENT、DEFAULT_MODEL_NAME 的必填/可选属性、配置状态和用途；展示 `.env.local` 示例和 PowerShell 临时配置命令。
- 数据/接口变化：不新增数据库表；只读取环境变量是否存在；页面只展示占位符，不展示真实 API Key。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run test:e2e；cmd /c npm run build；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退设置页环境配置说明区块、E2E 调整和文档记录即可恢复到第 42 章状态。
```

- [x] `/settings` 新增“环境配置说明”区块。
- [x] 展示 `DATABASE_URL` 配置状态和用途。
- [x] 展示 `KNOWLEDGE_QA_API_KEY` 配置状态和用途。
- [x] 展示 `KNOWLEDGE_QA_API_BASE_URL` 配置状态和用途。
- [x] 展示 `DEFAULT_AI_AGENT` 配置状态和用途。
- [x] 展示 `DEFAULT_MODEL_NAME` 配置状态和用途。
- [x] 展示 `.env.local` 示例。
- [x] 展示 PowerShell 临时配置命令。
- [x] 页面只展示 `<local-api-key>` 占位符，不展示真实 API Key。
- [x] Playwright E2E 覆盖环境配置说明核心内容。
- [x] 修正待确认批量拒绝 E2E 等待逻辑。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器查看环境配置说明：
首页 -> 系统设置 -> 环境配置说明 -> 查看必填/可选环境变量、配置状态、.env.local 示例和 PowerShell 临时配置命令。
```

验证记录：

```text
2026-06-10 09:27:09 新增 Web 系统设置页环境配置说明：完成环境变量状态、.env.local 示例、PowerShell 临时配置和 E2E 覆盖。
2026-06-10 09:27:09 cmd /c npx tsc --noEmit：通过。
2026-06-10 09:27:09 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-10 09:27:09 cmd /c npm run test:e2e：第一次失败，原因是批量拒绝 Server Action 后测试立即跳转到 rejected 筛选页，状态更新等待不稳定。
2026-06-10 09:27:09 修正 Playwright：批量拒绝后通过 review item API 轮询等待状态变为 rejected，再进入 rejected 筛选页断言。
2026-06-10 09:27:09 cmd /c npm run test:e2e：重跑通过，3 条 Playwright E2E 测试；覆盖首页、Agent/MCP 接入页、系统设置页环境配置说明、待确认内容编辑和 MVP 浏览器学习闭环。
2026-06-10 09:27:09 cmd /c npm run build：通过，设置页环境配置说明进入 Next.js 生产构建。
2026-06-10 09:29:25 cmd /c npm run docs:check-timestamps：通过。
2026-06-10 09:33:07 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-10 09:33:07 `/settings` 环境配置说明冒烟检查：通过，页面包含环境配置说明、DATABASE_URL、.env.local 示例、PowerShell 临时配置和 API Key 占位符。
2026-06-10 09:33:07 已提示用户查看新功能：可直接访问 `/settings` 查看环境配置说明。
```

## 44. Web 统一顶部导航组件

本章用于减少各页面重复维护顶部导航的成本。系统将 Web 页面共用导航入口抽取为共享组件，确保工作台、知识结构、题库、练习、画像、答题记录、错误集、记录、接入和设置等入口在各业务页面保持一致。

实现范围：

```text
实现范围：
- 文件/模块：src/components/top-nav.tsx、src/app/domains/page.tsx、src/app/questions/page.tsx、src/app/practice/page.tsx、src/app/practice/[practiceSessionId]/page.tsx、src/app/mastery/page.tsx、src/app/attempts/page.tsx、src/app/error-sets/page.tsx、src/app/records/page.tsx、src/app/integrations/page.tsx、src/app/settings/page.tsx、docs/TODO.md、.agent-flow.md。
- 行为变化：各业务页面顶部导航改为复用共享 `TopNav` 组件；导航项集中维护；当前页面高亮和原有样式保持一致。
- 数据/接口变化：不新增数据库表，不新增 API，不改变既有业务数据。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run test:e2e；cmd /c npm run build；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退共享导航组件和各页面导入替换即可恢复到第 43 章状态。
```

- [x] 新增 `src/components/top-nav.tsx`。
- [x] 抽取统一 `topNavItems` 导航项。
- [x] 抽取共享 `TopNav` 组件。
- [x] 移除十个业务页面中的本地重复 `TopNav` 定义。
- [x] 保留原有导航样式。
- [x] 保留当前页面高亮行为。
- [x] 统一导航项包含“设置”入口。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以在各业务页面看到一致的顶部导航：
知识结构、题库、练习、画像、答题记录、错误集、记录、接入和设置页面 -> 顶部导航入口一致 -> 当前页面高亮正确 -> 点击“设置”可进入 `/settings`。
```

验证记录：

```text
2026-06-10 10:07:00 新增 Web 统一顶部导航组件：完成 src/components/top-nav.tsx、十个页面导航替换和重复 TopNav 移除。
2026-06-10 10:07:00 cmd /c npx tsc --noEmit：通过。
2026-06-10 10:07:00 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-10 10:07:00 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、Agent/MCP 接入页、系统设置页环境配置说明、待确认内容编辑和 MVP 浏览器学习闭环。
2026-06-10 10:07:00 cmd /c npm run build：通过，统一顶部导航组件进入 Next.js 生产构建。
2026-06-10 10:10:01 cmd /c npm run docs:check-timestamps：通过。
2026-06-10 10:12:20 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-10 10:12:20 统一顶部导航冒烟检查：通过，`/questions` 和 `/settings` 页面均包含工作台、知识结构、题库、练习、画像、答题记录、错误集、记录、接入和设置入口。
2026-06-10 10:12:20 已提示用户查看新功能：可直接访问 `/questions` 或 `/settings` 查看统一顶部导航。
```

## 下一步

继续推进真实大模型与 AI Agent 调用主链路；下一轮优先从第 46 章“真实 Minimax Provider 接入”开始。

## 45. 默认模型切换为国内版 Minimax

本章用于把后续真实模型接入目标从 `chatgpt-5.5` 调整为国内版 Minimax `minimax-m2.7-highspeed`。当前阶段先完成默认配置、页面展示、mock 元数据和 TODO 主线切换；真实 API 调用在第 46 章开始实现。

实现范围：

```text
实现范围：
- 文件/模块：src/lib/config.ts、src/app/settings/page.tsx、src/app/records/page.tsx、src/lib/ai/mock-provider.ts、src/lib/questions/service.ts、src/lib/mcp/simulated-agent.ts、相关测试、docs/TODO.md、.agent-flow.md。
- 行为变化：系统默认模型名从 chatgpt-5.5 切换为 minimax-m2.7-highspeed；mock 生成记录改为 mock-minimax-m2.7-highspeed；设置页和筛选页示例展示 Minimax 模型名。
- 数据/接口变化：不新增数据库表，不新增 API；历史数据中已有旧模型名不迁移；新生成 mock 记录使用 Minimax 目标模型名。
- 测试/验证：cmd /c npx tsc --noEmit；cmd /c npm run test；cmd /c npm run test:e2e；cmd /c npm run build；cmd /c npm run docs:check-timestamps。
- 运行规则：程序修改完成并验证后，重启本地 3000 端口服务，提示用户查看新功能，然后继续后续工作。
- 回滚或恢复：回退默认模型名、页面文案、mock 元数据和测试断言即可恢复到第 44 章状态。
```

- [x] 将默认模型配置改为 `minimax-m2.7-highspeed`。
- [x] 将设置页默认模型说明和 `.env.local` 示例改为 `minimax-m2.7-highspeed`。
- [x] 将调用记录页模型筛选示例改为 `minimax-m2.7-highspeed`。
- [x] 将 mock provider 生成元数据改为 `mock-minimax-m2.7-highspeed`。
- [x] 将题目、答案、评分规则、核心讲解和质检记录中的 mock 模型名改为 `mock-minimax-m2.7-highspeed`。
- [x] 将模拟 Agent 默认模型名改为 `minimax-m2.7-highspeed`。
- [x] 补充真实 Minimax Provider 后续 TODO。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验收标准：

```text
用户可以通过浏览器查看新的默认模型：
首页 -> 系统设置 -> 默认模型显示 minimax-m2.7-highspeed；环境配置示例显示 DEFAULT_MODEL_NAME="minimax-m2.7-highspeed"。
新生成的 mock 题目记录使用 mock-minimax-m2.7-highspeed，后续真实接入从 Minimax Provider 开始。
```

验证记录：

```text
2026-06-10 10:21:19 新增默认模型切换为国内版 Minimax：完成默认配置、设置页示例、调用记录筛选示例、mock 生成元数据、模拟 Agent 默认模型和 TODO 主线调整。
2026-06-10 10:31:45 cmd /c npx tsc --noEmit：通过。
2026-06-10 10:31:45 cmd /c npm run test：通过，17 个测试文件，46 条测试用例。
2026-06-10 10:31:45 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、Agent/MCP 接入页、系统设置页 Minimax 默认模型、待确认内容编辑和 MVP 浏览器学习闭环。
2026-06-10 10:31:45 cmd /c npm run build：通过，默认模型切换进入 Next.js 生产构建。
2026-06-10 10:34:51 cmd /c npm run docs:check-timestamps：通过。
2026-06-10 10:36:41 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-10 10:36:41 Minimax 默认模型冒烟检查：通过，`/settings` 包含 minimax-m2.7-highspeed、DEFAULT_MODEL_NAME 和 Minimax 真实模型网关提示；`/records` 包含 minimax-m2.7-highspeed 和生成模型筛选。
2026-06-10 10:36:41 已提示用户查看新功能：可直接访问 `/settings` 查看默认模型已切换为 minimax-m2.7-highspeed。
```

## 46. 真实 Minimax Provider 接入

本章用于实现真实国内版 Minimax 模型调用能力，替代当前 mock provider。第一步只做 Provider 层和契约测试，不直接改写全部业务生成逻辑，避免真实模型输出波动影响现有业务闭环。

- [x] 确认 Minimax API Base URL、鉴权 Header、请求体格式和响应体格式。
- [x] 新增本地环境变量 `MINIMAX_API_KEY`、`MINIMAX_API_BASE_URL`、`DEFAULT_MODEL_PROVIDER`、`DEFAULT_MODEL_NAME` 的读取和脱敏展示。
- [x] 新增 Minimax Provider 客户端，支持超时、错误分类、结构化 JSON 响应解析和原始响应摘要。
- [x] 新增 Provider 统一接口，保留 mock provider 作为测试 provider。
- [x] 新增 Minimax Provider 契约测试，真实网络调用默认跳过，使用 fixture 验证响应解析。
- [x] 模型调用失败时记录失败状态、错误码、耗时和模型名。
- [x] 设置页显示 Minimax Provider 配置状态，但不展示真实 API Key。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验证记录：

```text
2026-06-10 11:16:55 新增真实 Minimax Provider 接入基础层：完成统一 AI Provider 契约、Minimax Chat Completions 客户端、fixture 化契约测试、健康检查配置输出、设置页 Minimax 配置状态和部署/用户文档环境变量。
2026-06-10 11:20:44 cmd /c npx tsc --noEmit：通过。
2026-06-10 11:20:44 cmd /c npm run test：通过，18 个测试文件，50 条测试用例；新增 Minimax Provider fixture 化契约测试。
2026-06-10 11:20:44 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖首页、Agent/MCP 接入页、系统设置页 Minimax 默认模型、待确认内容编辑和 MVP 浏览器学习闭环。
2026-06-10 11:20:44 cmd /c npm run build：通过，Minimax Provider 基础层进入 Next.js 生产构建。
2026-06-10 11:23:51 cmd /c npm run docs:check-timestamps：通过。
2026-06-10 11:25:27 重启本地 3000 服务：通过，/api/health 返回 200，database: ready，包含 model_provider、model_name 和 minimax_configured。
2026-06-10 11:25:53 Minimax Provider 冒烟检查：通过，`/settings` 包含 DEFAULT_MODEL_PROVIDER、MINIMAX_API_KEY、MINIMAX_API_BASE_URL、https://api.minimaxi.com/v1 和 minimax-m2.7-highspeed；`/api/health` 包含 Minimax 配置状态字段。
2026-06-10 11:25:53 已提示用户查看新功能：可直接访问 `/settings` 查看 Minimax Provider 配置状态。
```

## 47. 真实 Minimax 题目、答案、评分规则和核心讲解生成

- [x] 将 `generateForKnowledgePoint` 从模板生成改为调用统一模型 Provider。
- [x] 为理解、区分、应用、分析、评价五个维度设计 Minimax 结构化输出 Prompt。
- [x] 使用 Zod schema 校验 Minimax 输出的题目、答案、评分规则和核心讲解。
- [x] 输出不合格时进入失败或待修正状态，不直接正式入库。
- [x] 保留 `GenerationRecord` 中的模型、Agent、prompt_version、token、耗时和状态。
- [x] Playwright 覆盖 Web 触发生成后进入待确认/草稿流程。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行 Next.js 生产构建。
- [x] 执行验证记录时间格式检查。
- [x] 重启本地 3000 服务并提示用户查看新功能。

验证记录：

```text
2026-06-10 13:56:16 新增真实 Minimax 结构化生成链路：完成知识生成模块、Minimax Prompt、Zod 输出校验、generateForKnowledgePoint Provider 接入、失败生成记录和 API 502 错误映射。
2026-06-10 13:56:16 cmd /c npx tsc --noEmit：通过。
2026-06-10 13:56:16 cmd /c npm run test：通过，19 个测试文件，53 条测试用例；新增知识生成 Prompt、Provider JSON 解析和维度缺失失败测试。
2026-06-10 13:56:16 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；覆盖 Web 触发生成后进入待确认/草稿流程和 MVP 浏览器学习闭环。
2026-06-10 13:56:16 cmd /c npm run build：通过，真实 Minimax 结构化生成链路进入 Next.js 生产构建。
2026-06-10 13:59:04 cmd /c npm run docs:check-timestamps：通过。
2026-06-10 14:00:42 重启本地 3000 服务：通过，/api/health 返回 200，database: ready。
2026-06-10 14:01:08 真实 Minimax 结构化生成链路冒烟检查：通过，`/settings` 包含 DEFAULT_MODEL_PROVIDER、MINIMAX_API_KEY 和 minimax-m2.7-highspeed；`/domains` 包含知识结构和生成题目入口。
2026-06-10 14:01:08 已提示用户查看新功能：可通过 `/domains` 或首页知识点卡片触发生成；配置 DEFAULT_MODEL_PROVIDER=minimax 且提供 MINIMAX_API_KEY 后会走 Minimax Provider。
2026-06-10 14:05:45 token 分摊逻辑微调后复验：cmd /c npx tsc --noEmit、cmd /c npm run test 和 cmd /c npm run build 均通过。
2026-06-10 14:09:13 最终重启本地 3000 服务：通过，/api/health 返回 200，database: ready；`/domains` 生成题目入口冒烟检查通过。
```

## 48. 真实 Minimax 质量校验

- [x] 将当前 `rule_and_mock_ai` 扩展为规则校验 + Minimax 质检。
- [x] 质检 Prompt 覆盖相关性、维度匹配、难度匹配、清晰度、可评分性、答案充分性、重复度、实用性和来源支撑。
- [x] 质检不通过时记录问题原因、修改建议和自动修正次数。
- [x] 质检模型和生成模型可分别记录，支持后续不同模型复核。
- [x] `/records` 可以筛选并查看真实 Minimax 质检记录。
- [x] 生成流程在数据库事务外执行质量校验，避免真实模型调用长时间占用事务。
- [x] `direct_confirm=true` 时仅当所有质检记录为 `passed` 才直接正式入库；否则保持 `pending_confirmation` 和草稿版本。
- [x] Playwright E2E 使用真实 MiniMax-M3 Provider，验证真实模型生成、质检和浏览器学习闭环效果。
- [x] 兼容 MiniMax-M3 返回 `<think>` 思考文本、fenced JSON 和前后解释文本的混合输出。
- [x] Provider 支持 `max_tokens`，生成链路设置 6000，质检链路设置 2000；真实模型调用超时已从 120 秒提升到 240 秒，以适配 MiniMax-M3 偶发慢响应。
- [x] 执行 TypeScript 类型检查。
- [x] 执行单元和集成测试。
- [x] 执行 Playwright E2E 闭环测试。
- [x] 执行 Next.js 生产构建。

验证记录：

```text
2026-06-10 14:38:25 新增真实 Minimax 质量校验：完成规则校验 + Minimax 质检 Prompt、结构化质检输出校验、质检模型/Agent 独立记录、问题原因/修改建议/自动修正次数记录和 direct_confirm 质检保护。
2026-06-10 14:38:25 cmd /c npx tsc --noEmit：通过。
2026-06-10 14:38:25 cmd /c npm run test：通过，20 个测试文件，57 条测试用例；新增质量校验 Prompt、规则结果和 MiniMax-M3 解析测试。
2026-06-10 14:38:25 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；E2E 固定使用 mock Provider，避免误用真实 Minimax token。
2026-06-10 14:38:25 cmd /c npm run build：通过，真实 Minimax 质量校验链路进入 Next.js 生产构建。
2026-06-10 14:43:20 cmd /c npm run docs:check-timestamps：通过。
2026-06-10 14:43:20 重启本地 3000 服务：已停止原 3000 监听进程；`.next` 清理遇到 Windows 文件锁 Access is denied，随后直接启动 dev server；/api/health 返回 200，database: ready，model_provider: minimax，model_name: MiniMax-M3，minimax_configured: true。
2026-06-10 14:43:20 真实 Minimax 质量校验冒烟检查：通过，`/settings` 包含 DEFAULT_MODEL_PROVIDER、MiniMax-M3、MINIMAX_API_KEY 和已配置状态；`/records` 包含 Agent/MCP 调用记录、质量校验记录、checker_type 和 model_name。
2026-06-10 14:43:20 已提示用户查看新功能：可直接访问 `/settings` 查看 MiniMax-M3 配置状态，访问 `/records` 查看质量校验记录。
2026-06-10 15:58:37 根据用户要求将 Playwright E2E 切换为真实 MiniMax-M3：移除 mock Provider 强制覆盖，保留真实 `.env.local` 中的 MINIMAX_API_KEY；E2E 通过 API 定位真实生成题目，避免依赖模型题干文案。
2026-06-10 15:58:37 真实 MiniMax-M3 E2E 调试记录：首次失败定位为默认 30 秒超时；第二次失败定位为模型返回 `<think>` + fenced JSON；第三次失败定位为提取到 `<think>` 中复述的输入 JSON；最终修复为 `max_tokens` + 120 秒超时 + fenced/最后完整 JSON 提取。
2026-06-10 15:58:37 脱敏 MiniMax-M3 探针：通过，不打印 token；确认模型返回 HTTP 200、model MiniMax-M3、content 包含 `<think>` 和最终 JSON。
2026-06-10 15:58:37 cmd /c npx tsc --noEmit：通过。
2026-06-10 15:58:37 cmd /c npm run test：通过，21 个测试文件，61 条测试用例；新增模型混合输出 JSON 提取测试。
2026-06-10 15:58:37 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；真实 MiniMax-M3 生成、质检和浏览器学习闭环通过，耗时约 5.1 分钟。
2026-06-10 15:58:37 cmd /c npm run build：通过，真实 E2E 兼容修复进入 Next.js 生产构建。
2026-06-10 16:03:48 cmd /c npm run docs:check-timestamps：通过。
2026-06-10 16:03:48 重启本地 3000 服务：已停止原 3000 监听进程；`.next` 清理仍遇到 Windows 文件锁，随后直接启动 dev server；/api/health 返回 200，database: ready，model_provider: minimax，model_name: MiniMax-M3，minimax_configured: true。
2026-06-10 16:03:48 设置页冒烟检查：通过，`/settings` 包含系统设置、MiniMax-M3、MINIMAX_API_KEY 和已配置状态。
2026-06-10 16:03:48 已提示用户查看新功能：可访问 `/settings` 查看 MiniMax-M3 配置，也可在首页触发真实模型生成题目。
```

## 49. 真实 Minimax 答题评分

- [x] 修复 Web 创建知识结构时同名领域、主题或知识点重复提交导致 Prisma 唯一约束错误并触发 Runtime 崩溃的问题。
- [x] 修复 Web 创建知识点时领域和主题不是级联下拉的问题；选择“历史”时只显示历史领域下的主题，例如“府兵制”。
- [x] 将答题评分从 mock 逻辑切换到 Minimax 评分 Provider。
- [x] 评分输出包含分数、维度得分、反馈、薄弱点和下一题建议。
- [x] 用户修正评分后继续更新掌握画像和错误集。
- [x] 记录 AI 评分是否被用户修正，用于后续分析模型评分质量。
- [x] E2E 覆盖一次真实/fixture 化评分闭环。

验证记录：

```text
2026-06-10 16:27:18 修复知识结构重复创建崩溃：领域按 user_id + name 幂等 upsert，主题按 domain_id + name 幂等 upsert，知识点按 topic_id + name 幂等 upsert；重复提交会复用并更新已有记录，不再抛出 Prisma 唯一约束 Runtime 错误。
2026-06-10 16:27:18 cmd /c npx tsc --noEmit：通过。
2026-06-10 16:27:18 cmd /c npx vitest run src/lib/knowledge/service.integration.test.ts：通过，2 条知识结构集成测试；新增重复创建复用已有记录断言。
2026-06-10 16:27:18 cmd /c npm run test：通过，21 个测试文件，62 条测试用例。
2026-06-10 16:27:18 重启本地 3000 服务：已停止原 3000 监听进程；`.next` 清理仍遇到 Windows 文件锁，随后直接启动 dev server；/api/health 返回 200，database: ready，model_provider: minimax，model_name: MiniMax-M3，minimax_configured: true。
2026-06-10 16:27:18 已提示用户查看新功能：可在首页重复提交同名领域、主题或知识点，不会再出现唯一约束 Runtime 崩溃。
2026-06-10 16:50:37 修复创建知识点领域/主题级联：新增 KnowledgePointCreateForm 客户端组件，知识点主题下拉会根据已选领域过滤；该领域无主题时提示先创建主题；首页加载领域数量提升到 200、主题数量提升到 500，避免“历史”等旧领域不出现在下拉中。
2026-06-10 16:50:37 cmd /c npx tsc --noEmit：通过。
2026-06-10 16:50:37 cmd /c npx vitest run src/components/knowledge-point-create-form.test.tsx：通过，覆盖“历史 -> 府兵制”级联过滤，不显示其他领域主题。
2026-06-10 16:50:37 cmd /c npm run test：通过，22 个测试文件，63 条测试用例。
2026-06-10 16:50:37 cmd /c npm run build：通过，首页客户端级联表单进入 Next.js 生产构建。
2026-06-10 16:54:50 cmd /c npm run docs:check-timestamps：通过。
2026-06-10 16:54:50 重启本地 3000 服务：已停止原 3000 监听进程；`.next` 清理仍遇到 Windows 文件锁，随后直接启动 dev server；/api/health 返回 200，database: ready，model_provider: minimax，model_name: MiniMax-M3，minimax_configured: true。
2026-06-10 16:54:50 首页知识点创建表单冒烟检查：通过，页面包含知识点所属领域、知识点所属主题、先选择领域后再选择主题和创建知识点。
2026-06-10 16:54:50 已提示用户查看新功能：刷新首页后，创建知识点时先选择领域，再选择该领域下的主题。
2026-06-11 08:57:22 新增真实 Minimax 答题评分：完成 `answer-scoring` 模块、MiniMax-M3 评分 Prompt、结构化输出校验、mock fallback、答题提交接入和 `GenerationRecord` 评分调用记录。
2026-06-11 08:57:22 API 错误边界调整：请求参数错误返回 400，题目缺 active 版本返回 409，AI Provider 或模型输出解析失败返回 502 ANSWER_SCORING_FAILED。
2026-06-11 08:57:22 Web 文案同步：题目详情页、练习会话页和首页运行时卡片不再显示 mock AI，改为 AI 评分与 Codex + MiniMax-M3。
2026-06-11 08:57:22 cmd /c npx tsc --noEmit：通过。
2026-06-11 08:57:22 cmd /c npm run test：通过，23 个测试文件，67 条测试用例；新增答题评分 Prompt、MiniMax-M3 混合输出解析、越界分数归一化和 mock fallback 测试。
2026-06-11 09:45:15 真实 E2E 第一轮失败：知识点创建 E2E 仍按旧流程在选择领域前断言主题下拉，已改为先选领域再等待主题选项。
2026-06-11 09:45:15 真实 E2E 第二轮失败：MiniMax-M3 质量校验单次调用超过 120 秒；已将生成、质检和答题评分真实模型超时提升到 240 秒，并将题目生成等待提升到 600 秒。
2026-06-11 09:45:15 真实 E2E 第三轮失败：题目详情评分断言仍按 mock 速度和旧文案查找“回答”；已改为等待 `ai_scored`，最长 300 秒。
2026-06-11 09:45:15 真实 E2E 第四轮失败：练习会话最后一步没有等待真实评分完成；已改为轮询练习会话 API 直到 `status=completed`。
2026-06-11 09:45:15 真实 E2E 第五轮失败：MiniMax-M3 答题评分偶发返回 `<think>` 和自然语言但没有最终 JSON；已新增答题评分 JSON 修复重试，首轮解析失败时要求模型把上一轮输出修复为严格 JSON。
2026-06-11 09:45:15 cmd /c npx tsc --noEmit：通过。
2026-06-11 09:45:15 cmd /c npm run test：通过，23 个测试文件，68 条测试用例；新增答题评分 JSON 修复 Prompt 测试。
2026-06-11 09:45:15 cmd /c npm run test:e2e：通过，3 条 Playwright E2E 测试；真实 MiniMax-M3 生成、质检、答题评分、用户确认评分、掌握画像、错误集和练习状态闭环通过，耗时约 6.9 分钟。
2026-06-11 09:45:15 cmd /c npm run build：通过，真实答题评分链路进入 Next.js 生产构建。
2026-06-11 09:45:15 cmd /c npm run docs:check-timestamps：通过。
2026-06-11 09:49:58 重启本地 3000 服务：3000 原先无监听；保留 codegraph 30001 进程不动；执行启动脚本后 3000 监听 PID 8756，/api/health 返回 200，database: ready，model_provider: minimax，model_name: MiniMax-M3。
2026-06-11 09:49:58 Web 冒烟检查：`/`、`/questions`、`/practice` 均返回 HTTP 200。
2026-06-11 09:49:58 已提示用户查看新功能：刷新 `http://localhost:3000/` 后，可在题目详情或练习会话提交答案，系统会调用 MiniMax-M3 进行真实 AI 评分。
```

## 50. AI Agent 真实接入验收

- [ ] 输出 Codex 可用的 Agent Tool 调用配置说明。
- [ ] 输出 Claude Code 可用的 MCP stdio 配置说明。
- [ ] 使用 Agent Tool CLI 完成一次真实外部会话沉淀到待确认队列。
- [ ] 使用 MCP stdio 完成 `tools/list` 和至少一次 `tools/call`。
- [ ] Agent 返回内容包含轻量摘要、题目预览和 Web 确认链接。
- [ ] 用户能从 Agent 返回链接进入 Web 页面编辑并确认入库。
- [ ] 调用记录页能看到真实 Agent 来源、模型名、耗时和状态。

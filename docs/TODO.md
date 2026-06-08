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
下一步：继续推进 Web 知识结构维护能力。
当前实现：已完成本地 Next.js/TypeScript/SQLite/Prisma 项目骨架、核心 API、Agent/MCP 调用入口、真实数据 Web 工作台、基础管理入口和知识结构维护入口。
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
- [x] 确认模型调用来源：OpenAI、Claude、Minimax、本地模型、统一模型网关，或多模型。已确认：架构支持多模型适配；MVP 默认大模型为 chatgpt-5.5，默认 AI Agent 为 Codex。
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

- [x] 确认技术栈。已确认：Next.js + TypeScript + SQLite + Prisma + React/Tailwind；API 使用 Next.js Route Handlers；测试使用 Vitest + Playwright；AI 先做 mock provider，再接 chatgpt-5.5；MCP/Agent 先做 schema 和本地模拟调用脚本。
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
- [x] AI 生成第一版是否使用真实模型，还是先用 mock 生成器？已确认：先使用 mock AI provider，后续接 chatgpt-5.5。
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

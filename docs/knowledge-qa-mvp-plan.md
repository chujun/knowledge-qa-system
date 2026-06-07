# 个人知识问答系统 MVP 实施计划

日期：2026-06-07

关联文档：

```text
docs/knowledge-qa-business-model.md
docs/knowledge-qa-domain-model.md
docs/knowledge-qa-er-diagram.md
docs/knowledge-qa-api-draft.md
docs/knowledge-qa-mcp-tools.md
docs/knowledge-qa-architecture.md
docs/knowledge-qa-core-flows.md
docs/knowledge-qa-generation-quality.md
docs/knowledge-qa-mastery-model.md
docs/knowledge-qa-security.md
docs/knowledge-qa-observability.md
docs/TODO.md
```

## 阶段：MVP 实施计划

阶段结论：

```text
MVP 采用分阶段交付，先实现最小可用核心闭环，再补齐 Agent/MCP 调用验收。
第一版技术形态为本地全栈应用 + HTTP API + SQLite。
MCP/Agent 调用能力是验收标准的一部分，允许先用可模拟 Agent 调用闭环验证，后续实现完整 MCP Server。
```

已确认事项：

```text
MVP 交付物：Web + API。
架构：模块化单体，全栈应用。
部署：本地服务，不使用 Docker，后续迁移 Linux。
存储：SQLite。
认证：Web 本地单用户，API/Agent 使用 API Key。
模型：默认 chatgpt-5.5，默认 AI Agent 为 Codex。
第一版记录 token、耗时和模型调用成本。
```

待确认事项：

```text
具体技术栈。
是否第一阶段直接接入真实 chatgpt-5.5，还是先使用 mock AI 生成器。
本地服务端口。
API Key 生成和保存方式。
```

风险点：

```text
如果第一阶段同时实现完整 Web、完整 MCP Server、真实模型和所有报表，范围会过大。
AI 输出不稳定，测试必须先用 mock AI 固定输出验证业务规则。
SQLite 适合 MVP，但审计和模型调用记录增长后需要评估归档或迁移。
```

下一步动作：

```text
进入编码实现准备前，需要先补充部署运行文档、测试验证文档和用户使用说明。
```

## 1. MVP 核心闭环

MVP 必须能跑通：

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
-> Agent/API 外部会话沉淀验收
```

## 2. 里程碑 1：数据模型和核心 API

目标：

```text
建立系统数据底座和核心 API 框架。
```

交付物：

```text
SQLite 数据库迁移
核心实体表
基础 HTTP API
统一响应和错误结构
API Key 校验
健康检查接口
```

范围：

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
MasteryProfile
ErrorSet
SourceReference
GenerationRecord
QualityCheckRecord
ModelCallRecord
AuditEvent
```

验收标准：

```text
数据库能初始化。
健康检查接口返回 ok。
API 统一响应结构生效。
API Key 保护 Agent/API 调用。
可以创建领域、主题、知识点。
可以查询知识类型。
```

测试范围：

```text
表结构迁移测试
API Key 鉴权测试
领域/主题/知识点 CRUD 测试
健康检查测试
```

## 3. 里程碑 2：主题学习和待确认入库

目标：

```text
跑通主题学习入口和待确认入库状态流。
```

交付物：

```text
主题学习 API
沉淀任务状态流
待确认队列
正式入库动作
基础 Web 页面：待确认列表、详情、确认、拒绝
```

验收标准：

```text
用户可提交主题学习请求。
系统创建 IngestionTask。
系统生成或模拟生成知识点、讲解、题目。
系统创建 ReviewItem。
用户可在 Web 页面确认或拒绝。
确认后内容进入正式知识结构。
未确认内容不进入正式题库。
```

测试范围：

```text
IngestionTask 状态流测试
ReviewItem 确认/拒绝测试
正式入库业务不变量测试
未确认内容隔离测试
```

## 4. 里程碑 3：题目生成、质量校验、版本化

目标：

```text
实现结构化题目生成、标准答案、评分规则、核心讲解和质量校验闭环。
```

交付物：

```text
知识点复杂度判定
题目/答案/评分规则/讲解生成
规则校验
AI 校验或 mock AI 校验
自动修正状态记录
版本化保存
质量校验记录
```

验收标准：

```text
生成前能输出复杂度判断。
simple/medium/complex 能影响题量。
题目、答案、评分规则、讲解都能结构化保存。
缺少来源的事实/概念/操作题不能通过校验。
校验通过或警告通过后进入待确认。
校验失败超过重试次数进入待人工处理。
```

测试范围：

```text
复杂度判定规则测试
题量规则测试
版本创建测试
质量校验通过/警告/失败测试
自动修正次数上限测试
```

## 5. 里程碑 4：答题、评分、用户修正

目标：

```text
实现正式练习和答题评分闭环。
```

交付物：

```text
练习会话
题目选择
答题提交
AI 评分或 mock AI 评分
用户确认评分
用户修正评分
评分差异原因记录
答题反馈
```

验收标准：

```text
用户可以从主题或知识点开始练习。
答题记录绑定 QuestionVersion、AnswerVersion、ScoringRubricVersion。
系统返回 AI 评分、等级、诊断标签和反馈。
用户可确认或修正评分。
用户修正后保留 AI 原始评分和差异原因。
```

测试范围：

```text
PracticeSession 状态测试
AnswerAttempt 版本绑定测试
AI 评分确认测试
用户修正评分测试
评分差异原因测试
```

## 6. 里程碑 5：掌握画像和错误集

目标：

```text
实现知识点、主题、领域三级掌握画像和错误集复盘。
```

交付物：

```text
知识点画像计算
主题画像聚合
领域画像聚合
错误集生成
错误集复盘入口
下一步练习建议
```

验收标准：

```text
正式答题记录可更新知识点画像。
主题画像可由知识点画像聚合。
领域画像可由主题画像聚合。
低分或明显诊断标签可生成错误集。
临时题默认不计入长期画像。
用户确认临时题入库后可选择补计入。
```

测试范围：

```text
知识点画像计算测试
主题画像聚合测试
领域画像聚合测试
错误集生成测试
临时题不计入测试
临时题补计入测试
```

## 7. 里程碑 6：外部会话沉淀 API

目标：

```text
让外部 Agent 或脚本能通过 API 提交会话沉淀任务。
```

交付物：

```text
POST /api/v1/ingestions/external-conversation
Idempotency-Key 支持
SourceReference 保存
Agent 预览响应
review_url 返回
```

验收标准：

```text
外部调用能创建 IngestionTask。
重复提交同一 Idempotency-Key 返回同一结果。
响应包含主题建议、知识点列表、题目预览和 review_url。
缺少会话内容和摘要时返回 CONTEXT_REQUIRED。
```

测试范围：

```text
外部会话 API 创建测试
幂等测试
上下文不足错误测试
API Key 鉴权测试
review_url 返回测试
```

## 8. 里程碑 7：MCP Tool 接入

目标：

```text
满足 AI Agent MCP/Agent 调用能力验收标准。
```

MVP 允许形态：

```text
MCP Tool schema + 本地模拟 Agent 调用脚本。
后续再实现完整 MCP Server。
```

交付物：

```text
qa_create_from_conversation schema
qa_create_instant_check schema
qa_search_topics schema
qa_get_review_queue schema
qa_confirm_ingestion schema
本地 Agent 调用验收脚本或模拟器
```

验收标准：

```text
Agent 调用能创建外部会话沉淀任务。
Agent 调用返回主题建议、知识点列表、题目预览和确认/编辑链接。
Agent 重复提交能触发幂等逻辑。
Agent 输入上下文不足时返回明确错误。
```

测试范围：

```text
Tool schema 校验测试
Agent 模拟调用测试
外部会话沉淀端到端测试
幂等测试
错误响应测试
```

## 9. AI Agent MCP/Agent 调用能力验收标准

系统必须证明：

```text
不是只具备普通 Web/API 能力。
可以被 AI Agent 以工具调用方式触发知识沉淀。
调用结果能返回 Agent 聊天框可读的轻量反馈。
用户可以从 Agent 返回的 review_url 进入 Web 页面确认或编辑。
```

最小验收场景：

```text
给定一段模拟 Codex 会话摘要。
调用 qa_create_from_conversation。
系统创建外部会话沉淀任务。
系统返回建议主题、知识点、题目预览和 review_url。
用户打开 review_url 后看到待确认内容。
```

## 10. 每个里程碑验收标准汇总

```text
M1：数据表和核心 API 可用。
M2：主题学习和待确认入库可用。
M3：题目生成、质检、版本化可用。
M4：答题、AI 评分、用户修正可用。
M5：掌握画像和错误集可用。
M6：外部会话沉淀 API 可用。
M7：Agent/MCP 调用能力可验证。
```

## 11. 每个里程碑测试范围汇总

```text
单元测试：领域规则、状态机、画像计算、质量校验规则。
集成测试：API、SQLite、版本绑定、待确认入库、Agent 调用。
端到端测试：主题学习到答题评分；外部 Agent 沉淀到 Web 确认。
安全测试：API Key、日志脱敏、敏感内容不泄露。
可观测性测试：模型调用记录、审计事件、健康检查。
```

## 12. 暂缓功能和原因

暂缓：

```text
团队知识库
多用户账号体系
学习目标和提醒计划
完整文档导入
向量库和语义检索
浏览器插件
移动端 App
复杂审计报表
模型 A/B 评测平台
Docker 部署
完整 MCP Server
```

原因：

```text
MVP 需要优先验证个人知识沉淀、题目生成、练习评分、掌握画像和 Agent 调用闭环。
过早引入团队、多用户、文档 RAG、完整 MCP Server 和 Docker 会显著扩大范围。
```

## 13. Mock AI 生成器策略

建议第一阶段支持 mock AI 生成器。

用途：

```text
稳定测试业务状态流。
稳定测试质量校验和版本绑定。
避免真实模型输出波动影响自动化测试。
降低早期开发成本。
```

mock 范围：

```text
知识点拆解
题目生成
答案生成
评分规则生成
质量校验结果
AI 评分结果
```

## 14. 真实 AI 接入切换条件

满足以下条件后接入真实 chatgpt-5.5：

```text
核心数据模型稳定。
主题学习到正式入库流程跑通。
题目、答案、评分规则版本绑定测试通过。
质量校验规则测试通过。
模型调用记录、token、耗时、成本记录可用。
日志脱敏规则可用。
```

接入后必须验证：

```text
真实模型生成结构化 JSON 是否稳定。
失败时是否能记录 ModelCallRecord。
超时时是否能进入失败或待重试状态。
输出内容是否经过 schema 校验。
```

## 15. 推荐开发顺序

```text
1. 初始化全栈应用项目。
2. 接入 SQLite 和迁移工具。
3. 实现核心表和基础 API。
4. 实现 Web 基础页面和待确认队列。
5. 使用 mock AI 跑通主题学习和题目生成。
6. 实现质量校验和版本化。
7. 实现练习、答题、评分和用户修正。
8. 实现掌握画像和错误集。
9. 实现外部会话沉淀 API。
10. 实现或模拟 Agent/MCP 调用验收。
11. 接入真实 chatgpt-5.5。
12. 补齐测试、部署和使用文档。
```


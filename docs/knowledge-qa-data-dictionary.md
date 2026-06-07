# 个人知识问答系统数据字典

日期：2026-06-07

本文记录当前数据库表的英文模型名、物理表名、中文表名和业务说明。SQLite MVP 阶段不支持原生表注释，因此中文说明先落在 `prisma/schema.prisma` 的模型文档注释和本文档中；后续迁移 PostgreSQL 时需要转换为 `COMMENT ON TABLE`。

## 表级说明

| Prisma 模型 | 物理表名 | 中文表名 | 业务说明 |
|---|---|---|---|
| User | users | 用户表 | 存储本地单用户或未来多用户账号的基础身份信息，是所有业务数据按用户隔离的根对象。 |
| KnowledgeDomain | knowledge_domains | 知识领域表 | 存储历史、计算机、AI、摄影等知识领域，用于组织主题、知识点和领域级掌握画像。 |
| KnowledgeTopic | knowledge_topics | 知识主题表 | 存储某个知识领域下较成体系的学习主题，例如 GitHub Actions，用于承载主题大纲和知识点集合。 |
| KnowledgeType | knowledge_types | 知识类型表 | 存储概念类、操作类、原理类等知识类型及讲解模板，用于指导不同知识点的讲解和出题方式。 |
| KnowledgePoint | knowledge_points | 知识点表 | 存储可被讲解、出题、练习和评估的最小学习单元，并关联领域、主题和知识类型。 |
| SourceReference | source_references | 来源引用表 | 记录外部会话、文档、链接等知识来源，保留来源系统、原文或摘要和可信度，支持溯源审计。 |
| IngestionTask | ingestion_tasks | 知识沉淀任务表 | 记录主题学习、即时掌握、外部会话沉淀等任务的输入、状态、预览结果和幂等键。 |
| ReviewItem | review_items | 待确认项表 | 存储 AI 生成后需要用户确认、编辑或拒绝的待办项，是正式入库前的统一业务闸门。 |
| Question | questions | 题目表 | 存储题目的稳定业务身份、认知维度、难度、状态和所属知识点，具体题干通过题目版本表管理。 |
| QuestionVersion | question_versions | 题目版本表 | 存储题干和题目内容的版本化快照，保留生成来源、模型和 Agent 信息，确保历史答题可追溯。 |
| AnswerVersion | answer_versions | 标准答案版本表 | 存储题目标准答案和答案讲解的版本化快照，支持答案迭代和历史答题绑定。 |
| ScoringRubricVersion | scoring_rubric_versions | 评分规则版本表 | 存储题目评分规则的版本化 JSON，答题评分必须绑定当时使用的评分规则版本。 |
| CoreExplanation | core_explanations | 核心讲解表 | 存储知识点核心讲解的稳定业务身份和状态，具体讲解内容通过核心讲解版本表管理。 |
| CoreExplanationVersion | core_explanation_versions | 核心讲解版本表 | 存储知识点核心讲解内容的版本化快照，并记录采用的知识类型模板、模型和 Agent 来源。 |
| GenerationRecord | generation_records | 生成记录表 | 记录 AI 生成题目、答案、评分规则、核心讲解等内容时的模型、Agent、提示词版本、token、耗时和成本。 |
| QualityCheckRecord | quality_check_records | 质量校验记录表 | 记录题目、答案、评分规则等内容的规则校验和 AI 质检结果，以及自动修正次数和通过状态。 |
| AnswerAttempt | answer_attempts | 答题记录表 | 记录用户一次答题的答案、AI 评分、用户确认评分、错误原因标签和是否计入长期掌握画像。 |
| MasteryProfile | mastery_profiles | 掌握画像表 | 存储知识点、主题或领域维度的五维掌握分、综合分、证据数量和薄弱维度摘要。 |
| ErrorSet | error_sets | 错误集表 | 按知识点聚合低分或用户修正后的错误答题记录，保存主要错误原因标签，用于复盘和针对性提问。 |
| PracticeSession | practice_sessions | 练习会话表 | 记录一次针对知识点、主题或领域的练习会话目标、选题策略和会话状态。 |
| PracticeSessionItem | practice_session_items | 练习会话题目表 | 记录练习会话中被选中的题目顺序、来源、状态和选题原因，支持解释为什么问这道题。 |

## 后续规范

- 新增 Prisma 模型时必须同步补充模型级中文表名、表说明和物理表名注释。
- 新增物理表时必须同步更新本文档。
- 后续迁移 PostgreSQL 时，表级中文说明必须转换为数据库原生 `COMMENT ON TABLE`。

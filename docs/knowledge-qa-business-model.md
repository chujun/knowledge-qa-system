# 个人知识问答系统业务建模文档

日期：2026-06-06

## 1. 系统定位

本系统是一套面向个人的知识学习、问答练习、掌握度追踪与外部 AI Agent 会话沉淀平台。

它不是单纯的知识库，也不是普通题库，而是帮助用户在日常生活、工作和 AI 对话中发现知识，将知识转化为可学习、可练习、可评估、可追溯的问答体系。

核心目标：

```text
发现知识
-> 沉淀为知识主题和知识点
-> 生成高质量题目、答案和核心讲解
-> 答题评估掌握情况
-> 根据薄弱点针对性提问
-> 保留来源、版本、模型、Agent 和审计记录
```

## 2. 核心用户与范围

MVP 阶段主要服务用户本人，系统按单用户体验设计。

但所有核心业务对象需要预留 `user_id`，方便未来扩展为多用户系统。

MVP 暂不实现团队知识库、共享权限、学习目标、提醒计划等能力。

## 3. 学习入口

系统支持三类学习入口。

### 3.1 主题学习模式

适用于用户想系统学习一个主题。

示例：

```text
帮我围绕 RAG 知识问答系统准备问答
帮我系统学习 GitHub Actions
```

流程：

```text
用户提出知识主题
-> 系统推荐知识领域
-> 系统拆解主题大纲、知识点、难度层级
-> 用户确认结构
-> 系统生成核心讲解、题目、答案、评分规则
-> 质量校验
-> 待确认
-> 正式入库
```

### 3.2 即时掌握模式

适用于用户临时遇到一个知识点，只想先理解并会用。

示例：

```text
GitHub Actions 怎么用？
帮我掌握 workflow 的基本写法
```

流程：

```text
具体问题或知识点
-> 快速解释和核心讲解
-> 生成 2-3 道小测题
-> 用户答题
-> AI 评分 + 用户确认
-> 询问是否沉淀到知识问答体系
```

即时掌握生成的题目默认是临时题，不自动进入正式题库。

### 3.3 外部会话沉淀模式

适用于用户在 Codex、Claude Code、ChatGPT、Claude 或其他 AI Agent 中讨论问题时，发现某段内容值得学习和检测掌握情况。

理想触发方式：

```text
把刚才关于 GitHub Actions 的讨论录入知识问答系统，生成理解题和应用题
```

系统通过 API/MCP 接收外部 Agent 传入的会话上下文、摘要或选中片段。

流程：

```text
外部 Agent 会话内容
-> MCP Tool 或 API 提交
-> 系统提取可学习知识
-> 推荐知识领域、主题、知识点
-> 生成题目预览
-> 返回 Agent 聊天框轻量确认信息
-> 用户确认或进入知识问答系统页面详细编辑
-> 正式入库
```

Agent 聊天框中需要返回：

```text
主题建议
知识点列表
题目预览
确认入口
编辑链接
```

MVP 中 Agent 侧只做轻量确认，不做复杂编辑。详细编辑在知识问答系统页面完成。

## 4. 核心业务对象

字段说明规则：

```text
每个业务对象都需要记录创建时间和更新时间。
字段命名使用英文名，文档中同时给出简体中文名。
MVP 单用户运行，但核心业务对象预留 user_id。
```

### 4.1 User 用户

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 用户 ID | 用户唯一标识 |
| name | 用户名称 | 用户显示名称 |
| created_at | 创建时间 | 用户创建时间 |
| updated_at | 更新时间 | 用户最后更新时间 |

MVP 可只有一个默认用户，但其他对象都要关联 `user_id`。

### 4.2 KnowledgeDomain 知识领域

用于对知识主题进行上层归档。

示例：

```text
AI
计算机
摄影
历史
生活技能
```

规则：

```text
系统根据主题推荐领域
用户最终确认
领域可信度、排序、名称可后续调整
```

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 知识领域 ID | 知识领域唯一标识 |
| user_id | 用户 ID | 所属用户 |
| name | 领域名称 | 例如 AI、计算机、摄影 |
| description | 领域描述 | 领域范围说明 |
| trust_policy | 可信度策略 | 该领域下来源可信度的默认策略 |
| sort_order | 排序值 | 用户自定义展示顺序 |
| status | 状态 | active / archived |
| created_at | 创建时间 | 领域创建时间 |
| updated_at | 更新时间 | 领域最后更新时间 |

### 4.3 KnowledgeTopic 知识主题

知识主题是系统学习的主要入口，代表一组有体系的学习内容。

示例：

```text
GitHub Actions
RAG 知识问答系统
曝光三要素
```

主题归属于某个知识领域。

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 知识主题 ID | 知识主题唯一标识 |
| user_id | 用户 ID | 所属用户 |
| domain_id | 知识领域 ID | 所属知识领域 |
| name | 主题名称 | 例如 GitHub Actions |
| description | 主题描述 | 主题学习范围说明 |
| outline | 主题大纲 | 系统拆解出的主题结构 |
| suggested_level | 建议难度层级 | 系统推荐的整体学习层级 |
| status | 状态 | draft / pending_confirmation / confirmed / archived |
| created_at | 创建时间 | 主题创建时间 |
| updated_at | 更新时间 | 主题最后更新时间 |

### 4.4 KnowledgePoint 知识点

知识点是主题下真正需要掌握的具体内容。

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 知识点 ID | 知识点唯一标识 |
| user_id | 用户 ID | 所属用户 |
| domain_id | 知识领域 ID | 所属知识领域 |
| topic_id | 知识主题 ID | 所属知识主题 |
| name | 知识点名称 | 具体需要掌握的知识点 |
| description | 知识点描述 | 知识点范围说明 |
| knowledge_type | 知识类型 | 概念类 / 操作类 / 原理类 / 场景应用类 / 方案评价类 / 事实信息类 |
| complexity_level | 复杂度等级 | simple / medium / complex |
| suggested_difficulty | 建议难度 | 1-5 |
| status | 状态 | draft / pending_confirmation / confirmed / archived |
| created_at | 创建时间 | 知识点创建时间 |
| updated_at | 更新时间 | 知识点最后更新时间 |

知识点需要标注知识类型和复杂度。

### 4.5 KnowledgeType 知识类型

MVP 采用六类知识类型：

```text
概念类
操作类
原理类
场景应用类
方案评价类
事实信息类
```

知识类型会影响：

```text
核心知识讲解模板
题目生成维度
质量校验标准
来源支撑强度
评分规则
```

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 知识类型 ID | 知识类型唯一标识 |
| user_id | 用户 ID | 所属用户，系统默认类型可为空 |
| code | 类型编码 | concept / operation / principle / scenario_application / solution_evaluation / factual |
| name | 类型名称 | 简体中文类型名 |
| description | 类型描述 | 类型适用范围 |
| explanation_template | 讲解模板 | 该类型默认核心讲解结构 |
| status | 状态 | active / archived |
| created_at | 创建时间 | 类型创建时间 |
| updated_at | 更新时间 | 类型最后更新时间 |

### 4.6 CoreExplanation 核心知识讲解

题目和答案不仅用于评分，也要帮助用户理解核心知识。

核心知识讲解分两层：

```text
知识点通用讲解
题目补充讲解
```

通用讲解绑定知识点，多个题目复用。

题目补充讲解绑定题目，用于解释这道题考什么、为什么这么问、常见误区是什么。

核心知识讲解需要版本化、来源引用、生成模型和 Agent 元数据。

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 核心讲解 ID | 核心知识讲解唯一标识 |
| user_id | 用户 ID | 所属用户 |
| knowledge_point_id | 知识点 ID | 所属知识点 |
| question_id | 题目 ID | 题目补充讲解关联的题目；知识点通用讲解可为空 |
| explanation_scope | 讲解范围 | knowledge_point / question |
| current_version_id | 当前版本 ID | 当前生效讲解版本 |
| status | 状态 | draft / pending_confirmation / confirmed / archived |
| created_at | 创建时间 | 讲解创建时间 |
| updated_at | 更新时间 | 讲解最后更新时间 |

### 4.6.1 CoreExplanationVersion 核心知识讲解版本

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 讲解版本 ID | 核心讲解版本唯一标识 |
| user_id | 用户 ID | 所属用户 |
| core_explanation_id | 核心讲解 ID | 所属核心讲解 |
| version_no | 版本号 | 讲解版本序号 |
| content | 讲解内容 | 按知识类型模板生成的讲解内容 |
| source_reference_id | 来源引用 ID | 讲解依据来源 |
| generation_record_id | 生成记录 ID | 讲解生成溯源 |
| status | 状态 | draft / active / archived |
| created_at | 创建时间 | 版本创建时间 |
| updated_at | 更新时间 | 版本最后更新时间 |

### 4.7 Question 题目

题目用于检测用户掌握情况。

题型 MVP 支持：

```text
主观问答
选择题
```

题目字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 题目 ID | 题目唯一标识 |
| user_id | 用户 ID | 所属用户 |
| knowledge_point_id | 知识点 ID | 所属知识点 |
| question_type | 题型 | subjective / choice |
| cognitive_dimension | 认知维度 | understanding / differentiation / application / analysis / evaluation |
| difficulty_level | 难度等级 | 1-5 |
| origin_type | 题目来源类型 | confirmed_bank / generated_variant / instant_check / external_session_draft |
| status | 状态 | draft / pending_confirmation / confirmed / temporary / archived |
| current_version_id | 当前版本 ID | 当前生效题目版本 |
| created_at | 创建时间 | 题目创建时间 |
| updated_at | 更新时间 | 题目最后更新时间 |

认知维度：

```text
理解
区分
应用
分析
评价
```

难度等级：

```text
1 入门识别
2 基础理解
3 常规应用
4 复杂分析
5 综合评价
```

题目来源类型：

```text
confirmed_bank：已确认正式题库
generated_variant：基于已入库知识点生成的变式题
instant_check：即时掌握小测题
external_session_draft：外部会话待确认题
```

题目状态：

```text
draft
pending_confirmation
confirmed
temporary
archived
```

### 4.8 QuestionVersion 题目版本

题目本身需要版本化。

每次重新生成、编辑、替换或归档，都要保留版本记录和生成来源。

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 题目版本 ID | 题目版本唯一标识 |
| user_id | 用户 ID | 所属用户 |
| question_id | 题目 ID | 所属题目 |
| version_no | 版本号 | 题目版本序号 |
| stem | 题干 | 题目正文 |
| options | 选项 | 选择题选项，主观题可为空 |
| question_explanation | 题目补充讲解 | 说明本题考察点和常见误区 |
| source_reference_id | 来源引用 ID | 题目依据来源 |
| generation_record_id | 生成记录 ID | 题目生成溯源 |
| status | 状态 | draft / active / archived |
| created_at | 创建时间 | 版本创建时间 |
| updated_at | 更新时间 | 版本最后更新时间 |

### 4.9 AnswerVersion 标准答案版本

标准答案需要版本化。

答题记录必须绑定当时使用的标准答案版本，便于追踪审计。

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 标准答案版本 ID | 标准答案版本唯一标识 |
| user_id | 用户 ID | 所属用户 |
| question_id | 题目 ID | 所属题目 |
| question_version_id | 题目版本 ID | 对应题目版本 |
| version_no | 版本号 | 答案版本序号 |
| answer_content | 标准答案内容 | 用于评分和讲解的标准答案 |
| key_points | 答案要点 | 标准答案关键点 |
| source_reference_id | 来源引用 ID | 答案依据来源 |
| generation_record_id | 生成记录 ID | 答案生成溯源 |
| status | 状态 | draft / active / archived |
| created_at | 创建时间 | 版本创建时间 |
| updated_at | 更新时间 | 版本最后更新时间 |

### 4.10 ScoringRubricVersion 评分规则版本

评分规则也需要版本化。

评分规则包括：

```text
评分维度
评分要点
扣分规则
满分标准
常见错误
AI 评分提示词版本
```

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 评分规则版本 ID | 评分规则版本唯一标识 |
| user_id | 用户 ID | 所属用户 |
| question_id | 题目 ID | 所属题目 |
| question_version_id | 题目版本 ID | 对应题目版本 |
| answer_version_id | 标准答案版本 ID | 对应标准答案版本 |
| version_no | 版本号 | 评分规则版本序号 |
| rubric_content | 评分规则内容 | 评分标准正文 |
| scoring_points | 评分要点 | 评分细则 |
| common_errors | 常见错误 | 常见错误和扣分规则 |
| prompt_version | 评分提示词版本 | AI 评分使用的提示词版本 |
| generation_record_id | 生成记录 ID | 评分规则生成溯源 |
| status | 状态 | draft / active / archived |
| created_at | 创建时间 | 版本创建时间 |
| updated_at | 更新时间 | 版本最后更新时间 |

### 4.11 AnswerAttempt 答题记录

记录用户每次答题。

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 答题记录 ID | 答题记录唯一标识 |
| user_id | 用户 ID | 所属用户 |
| question_id | 题目 ID | 所答题目 |
| question_version_id | 题目版本 ID | 答题时使用的题目版本 |
| answer_version_id | 标准答案版本 ID | 答题时使用的答案版本 |
| rubric_version_id | 评分规则版本 ID | 答题时使用的评分规则版本 |
| user_answer | 用户答案 | 用户原始作答内容 |
| ai_score | AI 评分 | AI 给出的分数 |
| ai_level | AI 等级 | AI 判断的掌握等级 |
| ai_diagnosis_tags | AI 诊断标签 | 理解不足 / 应用不足等 |
| user_confirmed_score | 用户确认评分 | 用户修正后的分数 |
| user_confirmed_level | 用户确认等级 | 用户修正后的等级 |
| score_diff_reason | 评分差异原因 | 用户修正 AI 评分的原因 |
| feedback | 答题反馈 | 缺失点、讲解、追问建议 |
| affects_mastery | 是否影响掌握度 | 是否计入长期掌握画像 |
| created_at | 创建时间 | 答题记录创建时间 |
| updated_at | 更新时间 | 答题记录最后更新时间 |

用户可修正 AI 评分。系统需要保留 AI 评分、用户确认评分和差异原因。

差异原因示例：

```text
AI 误判
用户表达不清
用户确实未掌握
标准答案不完善
评分规则不合理
```

### 4.12 MasteryProfile 掌握画像

掌握画像不是单一分数，而是综合画像。

掌握画像需要支持多个分析层级：

```text
知识领域掌握画像：用户在某个知识领域下的整体掌握情况
知识主题掌握画像：用户在某个主题下的整体掌握情况
知识点掌握画像：用户对单个知识点的五维掌握情况
```

因此 `MasteryProfile` 应当是可挂载到不同对象上的画像，而不是只绑定知识点。

输入：

```text
五维掌握分数
最近答题表现
错误原因
用户确认修正
错题记录
知识点复杂度
题目难度
```

输出：

```text
理解分
区分分
应用分
分析分
评价分
综合等级
薄弱维度
薄弱知识点
最近改善情况
建议下一步练习
```

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 掌握画像 ID | 掌握画像唯一标识 |
| user_id | 用户 ID | 所属用户 |
| target_type | 画像对象类型 | domain / topic / knowledge_point |
| target_id | 画像对象 ID | 对应领域、主题或知识点 ID |
| understanding_score | 理解分 | 理解维度掌握分 |
| differentiation_score | 区分分 | 区分维度掌握分 |
| application_score | 应用分 | 应用维度掌握分 |
| analysis_score | 分析分 | 分析维度掌握分 |
| evaluation_score | 评价分 | 评价维度掌握分 |
| overall_score | 综合分 | 综合掌握分 |
| overall_level | 综合等级 | 熟练 / 基本掌握 / 模糊 / 较弱 / 未掌握 |
| weak_dimensions | 薄弱维度 | 当前薄弱的认知维度 |
| weak_knowledge_points | 薄弱知识点 | 主题或领域画像下聚合出的薄弱知识点 |
| error_reason_summary | 错误原因摘要 | 聚合后的错误原因 |
| recent_performance | 近期表现 | 最近答题趋势 |
| next_practice_suggestion | 下一步练习建议 | 推荐练习策略 |
| calculated_at | 计算时间 | 本次画像计算时间 |
| created_at | 创建时间 | 画像创建时间 |
| updated_at | 更新时间 | 画像最后更新时间 |

### 4.13 ErrorSet 错误集

错误集采用组合模型：

```text
错题
薄弱知识点
错误原因
相关认知维度
复盘建议
```

系统目标不是只让用户重做错题，而是帮助用户知道为什么没掌握。

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 错误集 ID | 错误集唯一标识 |
| user_id | 用户 ID | 所属用户 |
| domain_id | 知识领域 ID | 可选，关联领域 |
| topic_id | 知识主题 ID | 可选，关联主题 |
| knowledge_point_id | 知识点 ID | 可选，关联知识点 |
| question_id | 题目 ID | 关联错题 |
| answer_attempt_id | 答题记录 ID | 产生错误的答题记录 |
| cognitive_dimension | 认知维度 | 错误对应的维度 |
| error_reason | 错误原因 | 概念混淆 / 应用不熟等 |
| review_suggestion | 复盘建议 | 后续复习建议 |
| status | 状态 | active / resolved / archived |
| created_at | 创建时间 | 错误记录创建时间 |
| updated_at | 更新时间 | 错误记录最后更新时间 |

### 4.14 SourceReference 来源引用

题目、答案、核心讲解、评分规则都需要保留来源。

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 来源引用 ID | 来源引用唯一标识 |
| user_id | 用户 ID | 所属用户 |
| source_type | 来源类型 | 外部会话 / 主题输入 / 即时问题 / 文档 / 网页 / 用户笔记 |
| source_system | 来源系统 | Codex / Claude Code / ChatGPT / Claude / Web 等 |
| source_title | 来源标题 | 来源材料标题 |
| source_content | 来源内容 | 原始内容片段 |
| source_summary | 来源摘要 | 来源内容摘要 |
| source_url_or_file_id | 来源链接或文件 ID | URL、文件 ID 或内部引用 |
| conversation_id | 会话 ID | 外部 AI 会话标识 |
| source_timestamp | 来源时间 | 原始来源发生时间 |
| trust_level | 可信度等级 | high / medium / low / custom |
| created_at | 创建时间 | 来源引用创建时间 |
| updated_at | 更新时间 | 来源引用最后更新时间 |

来源类型：

```text
外部会话
主题输入
即时问题
文档
网页
用户笔记
```

来源可信度采用默认值 + 用户可配置。

### 4.15 GenerationRecord 生成记录

用于记录由谁生成了什么内容。

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 生成记录 ID | 生成记录唯一标识 |
| user_id | 用户 ID | 所属用户 |
| target_type | 生成对象类型 | domain / topic / knowledge_point / question / answer / rubric / explanation / quality_check |
| target_id | 生成对象 ID | 被生成对象的 ID |
| generation_type | 生成方式 | AI 生成 / 用户编辑 / 系统规则生成 |
| source_reference_id | 来源引用 ID | 生成依据来源 |
| ai_agent | AI Agent | Codex / Claude Code / ChatGPT / Claude / 自建 Agent |
| model_name | 模型名称 | 例如 GPT-5.5、Minimax-M2.7-highspeed |
| model_version | 模型版本 | 模型具体版本 |
| prompt_version | 提示词版本 | 生成提示词版本 |
| generation_params | 生成参数 | temperature、top_p 等 |
| generated_at | 生成时间 | AI 生成发生时间 |
| quality_score | 质量评分 | 生成结果质量分 |
| user_action | 用户动作 | accepted / edited / rejected / pending |
| created_at | 创建时间 | 记录创建时间 |
| updated_at | 更新时间 | 记录最后更新时间 |

需要记录题目、答案、评分规则、核心讲解、质量校验等生成来源。

### 4.16 QualityCheckRecord 质量校验记录

题目生成后必须进行质量校验。

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 质量校验记录 ID | 质量校验记录唯一标识 |
| user_id | 用户 ID | 所属用户 |
| target_type | 校验对象类型 | question / answer / rubric / explanation |
| target_id | 校验对象 ID | 被校验对象 ID |
| check_type | 校验类型 | rule_check / ai_check / user_confirmation |
| check_agent | 校验 Agent | 执行校验的 Agent |
| check_model_name | 校验模型名称 | 执行 AI 校验的模型 |
| check_model_version | 校验模型版本 | 校验模型具体版本 |
| prompt_version | 校验提示词版本 | 校验提示词版本 |
| check_params | 校验参数 | 校验模型参数 |
| overall_score | 综合质量分 | 0-100 |
| result | 校验结果 | pass / warning / fail |
| issues | 问题列表 | 校验发现的问题 |
| suggestions | 修改建议 | 自动修正或人工处理建议 |
| retry_count | 重试次数 | 自动修正次数 |
| created_at | 创建时间 | 校验记录创建时间 |
| updated_at | 更新时间 | 校验记录最后更新时间 |

校验方式：

```text
规则校验
AI 校验
用户确认
```

### 4.17 AuditEvent 审计事件

完整审计覆盖：

```text
生成
确认
编辑
答题
评分
用户修正
版本更新
质量校验
自动修正
归档
废弃
来源冲突处理
```

MVP 可以先做事件日志，不必先做复杂审计页面。

字段建议：

| 英文字段名 | 简体中文名 | 说明 |
|---|---|---|
| id | 审计事件 ID | 审计事件唯一标识 |
| user_id | 用户 ID | 所属用户 |
| event_type | 事件类型 | 生成 / 确认 / 编辑 / 答题 / 评分 / 修正 / 归档等 |
| target_type | 事件对象类型 | 事件关联对象类型 |
| target_id | 事件对象 ID | 事件关联对象 ID |
| actor_type | 操作者类型 | user / system / ai_agent |
| actor_id | 操作者 ID | 用户 ID、系统 ID 或 Agent ID |
| before_snapshot | 变更前快照 | 变更前关键数据 |
| after_snapshot | 变更后快照 | 变更后关键数据 |
| metadata | 元数据 | 额外上下文 |
| created_at | 创建时间 | 审计事件创建时间 |
| updated_at | 更新时间 | 审计事件最后更新时间 |

## 5. 核心知识讲解模板

MVP 先按知识类型使用不同讲解模板。

### 5.1 概念类

```text
定义
核心特征
适用场景
易混概念
示例
```

### 5.2 操作类

```text
目标
前置条件
操作步骤
常见错误
验证方法
```

### 5.3 原理类

```text
背景问题
工作机制
关键因果关系
影响因素
示例
```

### 5.4 场景应用类

```text
场景描述
判断条件
处理策略
注意事项
示例
```

### 5.5 方案评价类

```text
方案说明
适用条件
优点
缺点/风险
取舍建议
```

### 5.6 事实信息类

```text
事实描述
来源依据
适用范围
变化风险
记忆提示
```

后续可按实际学习内容继续细分知识类型和模板。

## 6. 题目生成规则

### 6.1 先判断知识点复杂度

题目生成前，AI 必须先输出：

```text
知识点复杂度判断
复杂度理由
建议题量
建议覆盖维度
```

复杂度分三档：

```text
简单知识点：默认生成 2 题
中等知识点：默认生成 3-4 题
复杂知识点：默认生成 5-7 题
```

### 6.2 复杂度判定标准

简单知识点：

```text
定义清楚
边界单一
使用场景少
不涉及方案取舍
```

中等知识点：

```text
有多个组成部分
容易和相似概念混淆
有常见使用场景
有一定操作步骤
```

复杂知识点：

```text
涉及多个条件、流程或依赖
有明显应用场景
存在常见错误或风险
需要分析原因、评价方案或做取舍
```

### 6.3 维度覆盖规则

简单知识点：

```text
至少覆盖理解
如果有相似概念，增加区分
如果有明确用法，增加应用
```

中等知识点：

```text
至少覆盖理解、应用
如果有易混点，增加区分
如果涉及原因或结构，增加分析
```

复杂知识点：

```text
优先覆盖理解、区分、应用、分析
如果涉及方案优劣、风险、取舍，增加评价
```

### 6.4 硬性限制

```text
不能为了凑满五个维度强行出题
不能生成没有明确评分标准的题
不能生成脱离知识点的问题
不能生成多个只换说法但考点相同的问题
事实、概念、操作类题目必须有来源支撑
```

每道题必须包含：

```text
题目
题型
认知维度
难度等级 1-5
考察知识点
标准答案
评分要点
常见错误
题目补充讲解
来源引用
生成模型和 Agent 元数据
```

## 7. 质量校验规则

题目生成后必须经过：

```text
规则校验
-> AI 校验
-> 自动修正
-> 用户最终确认
```

自动修正最多 2-3 次。超过次数后进入待人工处理。

### 7.1 校验指标

每道题输出完整校验报告。

指标：

```text
相关性
维度匹配
难度匹配
清晰度
可评分性
答案充分性
重复度
实用性
来源支撑
```

每个指标需要有：

```text
评分 0-100
结论：通过 / 警告 / 失败
原因说明
修改建议
```

### 7.2 硬性失败项

只要触发以下任一问题，必须判定不通过：

```text
题目脱离知识点
认知维度明显不匹配
没有标准答案
没有评分要点
标准答案明显错误
题干表达不清，无法作答
无法根据评分规则判断对错
与同批题目高度重复
为了凑维度强行生成低价值问题
事实性内容缺少来源依据
```

### 7.3 通过标准

```text
通过：
综合分 >= 85，且核心指标均 >= 75

警告通过：
综合分 80-84，且核心指标均 >= 70

不通过：
综合分 < 80，或任一核心指标 < 70，或触发硬性失败项
```

核心指标：

```text
相关性
维度匹配
清晰度
可评分性
答案充分性
来源支撑
```

### 7.4 分题处理

```text
每道题独立校验
通过题进入待确认
警告通过题进入待确认并标记风险
不通过题自动修正
修正后重新校验
仍不通过则标记待人工处理
```

### 7.5 批次质量要求

整批题目不要求全部通过，但要满足知识点最低题量。

```text
简单知识点：至少 2 道可用题
中等知识点：至少 3 道可用题
复杂知识点：至少 5 道可用题
```

如果无法满足，提示用户：

```text
该知识点题目生成质量不足，建议重新拆分知识点或补充来源材料。
```

## 8. 状态流

### 8.1 生成内容状态流

```text
生成内容
-> 待确认
   -> 用户确认
      -> 正式入库
   -> 用户拒绝
      -> 废弃/归档
```

正式入库后：

```text
进入知识领域/主题/知识点结构
可以进入正式练习
答题记录计入掌握度
错题进入错误集
标准答案和评分规则进入版本管理
后续可复习、编辑、审计
```

正式入库前：

```text
可以预览
可以编辑
可以删除
不参与长期掌握度统计
不进入正式错题集
```

### 8.2 临时题状态流

```text
临时题
-> 已作答
   -> 用户认为有价值
      -> 待确认/编辑
         -> 正式入库
   -> 用户不确认
      -> 仅保留学习记录
```

临时题规则：

```text
可用于当次学习反馈
未确认不进入正式题库
未确认不计入长期掌握度
确认入库时，由用户选择是否补计入已有答题记录
用户没有确认时不计入
```

## 9. 答题与评分

练习方式支持：

```text
一次生成整套题用于预览和题库管理
一题一答追问式用于实际学习
```

AI 对用户回答进行评分，并输出：

```text
分数
等级
诊断标签
缺失点
建议复习知识点
下一道追问题或补强题
```

用户可以修正 AI 评分。

系统保留：

```text
AI 评分
用户确认评分
差异原因
是否影响掌握度
```

## 10. 掌握画像与针对性提问

掌握度采用组合制：

```text
分数
等级
诊断标签
五维掌握画像
错误原因
近期表现
```

掌握画像需要支持三个分析层级：

```text
知识领域掌握画像：
用于回答“我在 AI、计算机、摄影等领域整体掌握得怎么样？”

知识主题掌握画像：
用于回答“我在 GitHub Actions、RAG 知识问答系统等主题下掌握得怎么样？”

知识点掌握画像：
用于回答“我对 workflow 触发条件、向量检索、光圈等具体知识点掌握得怎么样？”
```

三个层级不是三套完全不同的数据模型，而是同一个 `MasteryProfile` 根据 `target_type` 挂载到不同对象上。

汇总关系：

```text
知识点画像
-> 聚合为主题画像
-> 聚合为领域画像
```

聚合时不能只做简单平均，应结合：

```text
知识点重要性
题目难度
答题次数
最近表现
错误原因
用户确认修正
临时题是否正式计入
```

这样系统既能做微观诊断，也能做宏观复盘：

```text
微观：某个知识点的应用维度偏弱
中观：某个主题下分析题整体偏弱
宏观：某个知识领域整体评价维度不足
```

针对性提问不是单独题库，而是一种练习生成策略。

触发场景：

```text
主动练习
答题后追问
即时掌握
阶段复盘
外部会话沉淀后的快速检测
```

MVP 优先支持：

```text
主动练习
答题后追问
即时掌握
```

针对性提问题目来源：

```text
优先使用已入库题目
题目不足或需要迁移检测时，生成临时变式题
即时掌握场景可生成即时小测题
```

临时变式题不自动进入正式题库。

## 11. 来源可信度与冲突处理

### 11.1 来源可信度

来源可信度采用系统默认值 + 用户可配置。

示例：

```text
官方文档：高
书籍：高
用户笔记：中高
外部 AI 会话：中
网页摘要：中低
未知来源：低
```

### 11.2 来源支撑规则

按题目类型决定来源支撑强度：

```text
事实类、概念类、操作类：强制来源支撑
应用类、分析类：建议来源支撑
评价类：弱约束，但需说明依据或前提
```

### 11.3 来源冲突处理

当多个来源对同一知识点说法冲突时：

```text
优先参考高可信来源
保留冲突说明
列出不同说法、来源可信度和适用条件
要求用户确认后才能更新标准答案
```

冲突不能被系统悄悄覆盖。

## 12. API 与 MCP 接入

API 是知识问答系统的业务能力底座。

MCP 是 AI Agent 接入知识问答系统的适配层。

推荐架构：

```text
Codex / Claude Code / 其他 AI Agent
        |
        | MCP Tool 调用
        v
知识问答 MCP Server
        |
        | 调用内部 API
        v
知识问答系统后端 API
        |
        v
领域 / 主题 / 知识点 / 题目 / 答题记录 / 掌握画像
```

MCP Server 不承载核心业务逻辑，只负责把 Agent 请求转换为系统 API 调用。

MVP 建议先设计核心 API，再包装 MCP Tool。

候选 MCP Tools：

```text
qa_create_from_conversation
qa_create_instant_check
qa_search_topics
qa_attach_to_topic
qa_get_review_queue
qa_confirm_ingestion
```

## 13. MVP 范围

MVP 必做：

```text
单用户知识领域、主题、知识点管理
知识类型标注
主题学习入口
即时掌握入口
外部会话沉淀入口的数据模型
核心知识讲解
主观问答和选择题
题目、答案、评分规则版本化
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
基础 API 设计
MCP 接入能力预留
审计事件日志
```

MVP 可简化：

```text
Agent 侧只做轻量确认，不做复杂编辑
AI Agent/模型质量分析只记录元数据，不做统计报表
质量校验可先用规则校验 + 同模型 AI 校验
审计只做事件日志，不做复杂审计页面
MCP 可先设计接口和工具 schema，后续再完整实现
```

## 14. 暂不做范围

MVP 暂不做：

```text
学习目标和学习计划
复习提醒
团队知识库
共享权限
完整模型质量评测平台
不同模型 A/B 出题对比
复杂审计报表
自动文档导入
浏览器插件
移动端 App
```

## 15. 关键设计原则

```text
用户主动沉淀，不自动污染知识库
待确认内容不参与长期掌握度
临时题不自动进入正式题库
题目、答案、讲解、评分规则都需要版本化和溯源
AI 生成必须经过质量校验
用户确认是最终业务闸门
API 是业务底座，MCP 是 Agent 接入层
掌握度应解释为什么薄弱，而不只是给分数
```

# 个人知识问答系统题目生成与质量校验细化

日期：2026-06-07

关联文档：

```text
docs/knowledge-qa-business-model.md
docs/knowledge-qa-domain-model.md
docs/knowledge-qa-core-flows.md
docs/TODO.md
```

## 阶段：题目生成与质量校验细化

阶段结论：

```text
题目生成必须先判断知识点复杂度，再决定题量、认知维度和题型。
AI 生成结果必须输出结构化 schema，并经过规则校验、AI 校验、自动修正和用户最终确认。
质量校验记录需要包含校验 Agent、模型、提示词版本、指标评分、问题原因和修改建议。
```

已确认事项：

```text
知识点复杂度分为 simple / medium / complex。
题目认知维度包括理解、区分、应用、分析、评价。
题目难度为 1-5。
MVP 题型包括主观问答和选择题。
自动修正最多 2-3 次。
质量校验由规则校验 + AI 校验 + 用户最终确认组成。
```

待确认事项：

```text
每个质量指标的权重是否需要在 MVP 中可配置。
是否允许用户手动降低质量阈值让警告题入库。
警告通过题是否默认进入待确认，还是需要特殊标记分区。
```

风险点：

```text
大模型可能为了覆盖维度强行生成低价值题。
标准答案如果缺少来源支撑，会影响评分和学习质量。
AI 校验如果使用同一模型，可能存在自我放过问题，后续可引入不同模型复核。
```

下一步动作：

```text
进入掌握画像和针对性提问细化，生成 docs/knowledge-qa-mastery-model.md。
```

## 1. 知识点复杂度判定

生成题目前必须先判定知识点复杂度。

输入：

```json
{
  "knowledge_point_name": "workflow 触发条件",
  "knowledge_point_description": "理解 GitHub Actions workflow 的触发方式",
  "knowledge_type": "操作类",
  "source_summary": "讨论了 push、pull_request、schedule 等触发方式"
}
```

输出 schema：

```json
{
  "complexity_level": "medium",
  "complexity_reason": "该知识点涉及多个触发方式、常见条件配置和使用场景，但不涉及复杂架构取舍。",
  "suggested_question_count": 4,
  "suggested_dimensions": ["understanding", "application", "analysis"],
  "source_support_required": true
}
```

判定规则：

```text
simple：
定义清楚，边界单一，使用场景少，不涉及方案取舍。

medium：
有多个组成部分，容易和相似概念混淆，有常见使用场景，有一定操作步骤。

complex：
涉及多个条件、流程或依赖，有明显应用场景，存在常见错误或风险，需要分析原因、评价方案或做取舍。
```

## 2. 按复杂度决定题量

```text
simple：默认 2 题
medium：默认 3-4 题
complex：默认 5-7 题
```

硬性限制：

```text
不能为了凑满五个维度强行出题。
不能生成没有明确评分标准的题。
不能生成脱离知识点的问题。
不能生成多个只换说法但考点相同的问题。
```

维度覆盖：

```text
simple：
至少覆盖理解；有易混点时增加区分；有明确用法时增加应用。

medium：
至少覆盖理解、应用；有易混点时增加区分；涉及原因或结构时增加分析。

complex：
优先覆盖理解、区分、应用、分析；涉及风险、优劣、取舍时增加评价。
```

## 3. 五个认知维度题目模板

### 3.1 理解

目标：

```text
检查用户是否能解释概念、目的、基本原理或基本用途。
```

题目模板：

```text
请用自己的话解释 X 是什么。
X 的核心作用是什么？
为什么需要 X？
```

评分关注：

```text
是否说出定义
是否说明用途
是否覆盖关键组成
是否避免明显误解
```

### 3.2 区分

目标：

```text
检查用户是否能区分相似概念、边界和适用条件。
```

题目模板：

```text
X 和 Y 有什么区别？
什么情况下应该使用 X，而不是 Y？
下面几个说法中，哪个最容易混淆？为什么？
```

评分关注：

```text
是否指出关键差异
是否说明适用边界
是否识别易混点
```

### 3.3 应用

目标：

```text
检查用户是否能在具体场景里使用知识。
```

题目模板：

```text
如果遇到场景 S，你会如何使用 X？
请给出实现步骤。
请根据条件 C 写出配置或处理方案。
```

评分关注：

```text
是否匹配场景
步骤是否完整
是否考虑前置条件
是否能落地执行
```

### 3.4 分析

目标：

```text
检查用户是否能拆解原因、结构、影响因素和故障点。
```

题目模板：

```text
如果出现问题 P，可能是哪几个环节导致？
请分析方案 S 失败的原因。
条件 C 变化后，会影响哪些部分？
```

评分关注：

```text
是否拆解多个因素
是否建立因果关系
是否区分主因和次因
是否提出验证路径
```

### 3.5 评价

目标：

```text
检查用户是否能判断方案优劣、风险和取舍。
```

题目模板：

```text
方案 A 和方案 B 哪个更适合场景 S？为什么？
这个做法有哪些风险？
这个方案的前提条件和取舍是什么？
```

评分关注：

```text
是否说明评价标准
是否指出优缺点
是否识别风险
是否能结合场景做取舍
```

## 4. 六类知识类型讲解模板

### 4.1 概念类

```json
{
  "definition": "定义",
  "core_features": ["核心特征"],
  "applicable_scenarios": ["适用场景"],
  "confusing_concepts": ["易混概念"],
  "examples": ["示例"]
}
```

### 4.2 操作类

```json
{
  "goal": "目标",
  "prerequisites": ["前置条件"],
  "steps": ["操作步骤"],
  "common_mistakes": ["常见错误"],
  "verification_methods": ["验证方法"]
}
```

### 4.3 原理类

```json
{
  "background_problem": "背景问题",
  "mechanism": "工作机制",
  "causal_links": ["关键因果关系"],
  "influencing_factors": ["影响因素"],
  "examples": ["示例"]
}
```

### 4.4 场景应用类

```json
{
  "scenario": "场景描述",
  "decision_conditions": ["判断条件"],
  "strategy": "处理策略",
  "notes": ["注意事项"],
  "examples": ["示例"]
}
```

### 4.5 方案评价类

```json
{
  "solution": "方案说明",
  "applicable_conditions": ["适用条件"],
  "advantages": ["优点"],
  "risks": ["缺点或风险"],
  "tradeoff_suggestion": "取舍建议"
}
```

### 4.6 事实信息类

```json
{
  "fact": "事实描述",
  "source_basis": "来源依据",
  "applicable_scope": "适用范围",
  "change_risk": "变化风险",
  "memory_tip": "记忆提示"
}
```

## 5. 题目生成输出 schema

```json
{
  "knowledge_point_id": "kp_001",
  "complexity": {
    "level": "medium",
    "reason": "涉及多个触发方式和配置条件",
    "suggested_question_count": 4
  },
  "questions": [
    {
      "stem": "GitHub Actions 的 workflow 文件通常放在哪个目录？",
      "question_type": "subjective",
      "cognitive_dimension": "understanding",
      "difficulty_level": 2,
      "tested_knowledge": "workflow 文件位置",
      "source_reference_ids": ["src_001"],
      "question_explanation": "本题检查用户是否理解 workflow 的基本文件位置。"
    }
  ]
}
```

## 6. 标准答案生成输出 schema

```json
{
  "question_stem": "GitHub Actions 的 workflow 文件通常放在哪个目录？",
  "answer_content": "workflow 文件通常放在仓库根目录下的 .github/workflows 目录中，文件扩展名通常为 .yml 或 .yaml。",
  "key_points": [
    {
      "point": ".github/workflows",
      "required": true,
      "score_weight": 0.7
    },
    {
      "point": "YAML 文件",
      "required": false,
      "score_weight": 0.3
    }
  ],
  "source_reference_ids": ["src_001"]
}
```

## 7. 评分规则生成输出 schema

```json
{
  "rubric_content": "满分答案应指出 workflow 文件位于 .github/workflows 目录，并说明通常使用 yml/yaml 文件。",
  "scoring_points": [
    {
      "criterion": "指出正确目录",
      "max_score": 70
    },
    {
      "criterion": "说明文件格式",
      "max_score": 30
    }
  ],
  "common_errors": [
    {
      "error": "误认为 workflow 文件可以放在任意目录",
      "deduction": 50
    }
  ],
  "score_scale": {
    "min": 0,
    "max": 100
  }
}
```

## 8. 核心讲解生成输出 schema

```json
{
  "knowledge_type": "operation",
  "explanation_scope": "knowledge_point",
  "content": {
    "goal": "理解 workflow 文件如何被 GitHub Actions 识别",
    "prerequisites": ["了解 GitHub 仓库结构", "了解 YAML 文件"],
    "steps": [
      "在仓库根目录创建 .github/workflows 目录",
      "在该目录下创建 yml 或 yaml 文件",
      "在文件中配置 on、jobs、steps"
    ],
    "common_mistakes": ["把 workflow 文件放到错误目录"],
    "verification_methods": ["在 GitHub Actions 页面查看 workflow 是否被识别"]
  },
  "source_reference_ids": ["src_001"]
}
```

## 9. 规则校验

规则校验不依赖 AI，先检查结构和硬性约束。

检查项：

```text
必填字段是否完整
题目是否有关联知识点
题目是否有关联标准答案
题目是否有关联评分规则
认知维度是否合法
难度是否在 1-5
题型是否合法
事实/概念/操作类题目是否有来源引用
同批题目题干是否高度重复
题目数量是否符合复杂度规则
```

规则校验输出：

```json
{
  "result": "fail",
  "issues": [
    {
      "code": "SOURCE_REQUIRED",
      "message": "操作类题目必须有来源引用",
      "severity": "error"
    }
  ]
}
```

## 10. AI 校验

AI 校验指标：

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

AI 校验输出 schema：

```json
{
  "overall_score": 86,
  "result": "pass",
  "metrics": [
    {
      "name": "relevance",
      "score": 90,
      "result": "pass",
      "reason": "题目紧扣 workflow 文件位置"
    }
  ],
  "issues": [],
  "suggestions": []
}
```

通过标准：

```text
pass：
综合分 >= 85，且核心指标均 >= 75。

warning：
综合分 80-84，且核心指标均 >= 70。

fail：
综合分 < 80，或任一核心指标 < 70，或触发硬性失败项。
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

## 11. 自动修正

触发条件：

```text
规则校验失败
AI 校验 fail
AI 校验 warning 且问题可自动修正
```

自动修正输入：

```json
{
  "question": {},
  "answer": {},
  "rubric": {},
  "quality_issues": [],
  "fix_instruction": "修复题目清晰度和来源支撑问题，不要改变考察知识点。"
}
```

停止条件：

```text
校验通过
达到最大修正次数 3
修正后仍违反硬性失败项
模型调用失败
```

超过次数：

```text
标记 failed_manual_required。
创建待人工处理项。
保留每次修正前后的版本和 QualityCheckRecord。
```

## 12. 警告通过题目处理

warning 题目可以进入待确认，但必须带风险标记。

风险标记示例：

```text
题干条件略少
评分要点需要用户确认
来源支撑较弱
可能与同批题有部分重叠
```

用户确认前：

```text
不得进入正式题库。
不得计入正式练习。
```

## 13. 待人工处理题目

进入条件：

```text
自动修正超过 3 次。
标准答案疑似错误。
来源冲突未解决。
题目无法评分。
AI 无法生成有效题目。
```

用户可操作：

```text
手动编辑题目、答案、评分规则。
重新触发质量校验。
归档该题。
补充来源材料后重新生成。
```

## 14. 质量校验审计事件

需要记录：

```text
quality_check_started
rule_check_passed
rule_check_failed
ai_check_passed
ai_check_warning
ai_check_failed
auto_fix_started
auto_fix_completed
manual_review_required
user_confirmed_quality
user_rejected_quality
```

每个事件记录：

```text
target_type
target_id
generation_record_id
quality_check_record_id
model_call_record_id
actor_type
before_snapshot
after_snapshot
metadata
created_at
```

## 15. 生成和质检验收点

```text
系统能先判定知识点复杂度，再生成题目。
simple/medium/complex 能影响题量。
五个认知维度有明确题目模板。
六类知识类型有明确讲解模板。
题目、答案、评分规则、讲解都能输出结构化 schema。
缺少来源的事实/概念/操作题不能通过规则校验。
AI 校验能输出指标分、问题原因和修改建议。
自动修正最多 3 次。
警告通过题目能进入待确认并带风险标记。
不通过题目能进入待人工处理。
质量校验全过程有审计事件和模型调用记录。
```


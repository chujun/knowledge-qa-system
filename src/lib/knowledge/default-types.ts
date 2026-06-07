export const defaultKnowledgeTypes = [
  {
    code: "concept",
    name: "概念类",
    description: "用于解释定义、核心特征、边界和易混概念。",
    explanationTemplate: ["定义", "核心特征", "适用场景", "易混概念", "示例"]
  },
  {
    code: "operation",
    name: "操作类",
    description: "用于解释步骤、前置条件、操作结果和常见问题。",
    explanationTemplate: ["目标", "前置条件", "操作步骤", "验证方式", "常见问题"]
  },
  {
    code: "principle",
    name: "原理类",
    description: "用于解释机制、因果关系和适用约束。",
    explanationTemplate: ["背景", "核心机制", "关键约束", "示例", "误区"]
  },
  {
    code: "comparison",
    name: "对比类",
    description: "用于解释多个概念、方案或工具之间的差异。",
    explanationTemplate: ["对比对象", "相同点", "差异点", "选择建议", "示例"]
  },
  {
    code: "case",
    name: "案例类",
    description: "用于解释具体案例、场景和经验复盘。",
    explanationTemplate: ["场景", "问题", "处理过程", "结果", "复盘要点"]
  },
  {
    code: "strategy",
    name: "策略类",
    description: "用于解释决策规则、权衡和行动建议。",
    explanationTemplate: ["目标", "约束", "策略", "权衡", "行动建议"]
  }
] as const;

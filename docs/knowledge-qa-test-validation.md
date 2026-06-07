# 个人知识问答系统测试验证文档

日期：2026-06-07

关联文档：

```text
docs/TODO.md
docs/knowledge-qa-mvp-plan.md
docs/knowledge-qa-deployment.md
```

## 阶段：测试验证

阶段结论：

```text
MVP 骨架阶段已建立单元测试、生产构建测试和 Playwright E2E 测试。
当前测试重点是固化业务不变量、掌握画像计算、MCP/Agent 调用契约和首页可访问性。
```

已确认事项：

```text
单元测试使用 Vitest。
端到端测试使用 Playwright Chromium。
Windows 环境使用 cmd /c npm ... 执行 npm 脚本。
Playwright Chromium Headless Shell 已通过离线 zip 安装。
```

待确认事项：

```text
后续业务 API 实现后，需要补充 API 集成测试。
后续真实 MCP Server 实现后，需要补充 Agent 到 MCP Server 的进程级测试。
后续真实模型接入后，需要补充 mock provider 和真实 provider 的契约测试。
```

风险点：

```text
当前数据库业务表尚未实现，测试仍以纯领域规则和模拟 Agent 调用为主。
E2E 当前只覆盖首页基础可访问，尚未覆盖完整业务闭环。
Playwright 浏览器依赖在网络下载时可能超时，需要保留离线安装路径。
```

下一步动作：

```text
继续编写用户使用说明。
后续实现业务 API 后，按本文测试矩阵扩展集成测试和 E2E 测试。
```

## 1. 测试分层

| 层级 | 工具 | 当前覆盖 | 后续扩展 |
|---|---|---|---|
| 领域规则单元测试 | Vitest | 业务不变量、状态流、质量决策 | 接入更多领域服务 |
| 掌握画像测试 | Vitest | 知识点、主题、领域聚合 | 引入最近表现、难度权重细化 |
| 安全测试 | Vitest | API Key 校验 | API 路由鉴权中间件 |
| MCP/Agent 契约测试 | Vitest + Zod | Tool schema、模拟 Agent 输出 | 真实 MCP Server 工具调用 |
| 构建测试 | Next.js build | TypeScript 和生产构建 | CI/CD 构建 |
| E2E 测试 | Playwright | 首页可访问 | 待确认、练习、画像、Agent 沉淀闭环 |

## 2. 当前测试命令

单元测试：

```powershell
cmd /c npm run test
```

生产构建：

```powershell
cmd /c npm run build
```

端到端测试：

```powershell
cmd /c npm run test:e2e
```

## 3. 当前验证结果

```text
2026-06-07 cmd /c npm run test：通过，10 个测试文件，30 条测试用例。
2026-06-07 cmd /c npm run build：通过。
2026-06-07 cmd /c npm run test:e2e：通过，1 条 Playwright E2E 测试。
```

E2E 运行时提示：

```text
Next.js 提示未来版本可能需要配置 allowedDevOrigins，当前不影响测试通过。
```

## 4. 已覆盖测试清单

领域规则：

```text
待确认内容不进入正式题库。
临时题不计入长期掌握画像。
正式入库必须经过 pending_confirmation -> confirmed。
题目、答案、评分规则版本必须 active。
答题记录必须绑定历史题目版本、答案版本、评分规则版本。
AI 原始评分和用户修正评分双轨记录。
```

掌握画像：

```text
知识点级五维分数计算。
主题级聚合。
领域级聚合。
```

错误集：

```text
低分答题进入错误集。
用户下调 AI 评分的答题进入错误集。
错误原因标签按知识点聚合。
```

外部会话沉淀：

```text
source_system + conversation_id + instruction 生成稳定幂等键。
显式 idempotency_key 优先。
重复提交返回已有沉淀任务。
```

质量校验：

```text
校验失败且未超过次数时进入自动修正。
超过自动修正次数后进入人工处理。
warning 可警告通过。
passed 可直接通过。
```

来源冲突：

```text
新来源内容与 active 内容一致时无冲突。
新来源内容与 active 内容不一致时必须用户确认。
```

API 鉴权：

```text
支持 X-API-Key。
支持 Authorization: Bearer。
缺失、错误、未配置 API Key 均拒绝。
```

MCP/Agent：

```text
qa_create_from_conversation 输入 schema。
qa_create_from_conversation 输出 schema。
缺少 conversation_content 和 conversation_summary 时拒绝。
模拟 Agent 调用可创建外部会话沉淀任务。
模拟 Agent 返回主题建议、知识点列表、题目预览和确认链接。
模型与 Agent 元数据进入调用记录。
```

E2E：

```text
首页可打开。
页面展示个人知识问答工作台。
```

## 5. Playwright 离线安装记录

当前缺失项曾是：

```text
C:\Users\cj\AppData\Local\ms-playwright\chromium_headless_shell-1223\chrome-headless-shell-win64\chrome-headless-shell.exe
```

离线 zip：

```text
C:\Users\cj\Downloads\chrome-headless-shell-win64.zip
```

安装目标：

```text
C:\Users\cj\AppData\Local\ms-playwright\chromium_headless_shell-1223
```

期望结构：

```text
C:\Users\cj\AppData\Local\ms-playwright\chromium_headless_shell-1223\chrome-headless-shell-win64\chrome-headless-shell.exe
C:\Users\cj\AppData\Local\ms-playwright\chromium_headless_shell-1223\INSTALLATION_COMPLETE
```

## 6. 后续测试矩阵

里程碑 1：数据模型和核心 API

```text
Prisma migration 测试。
领域/主题/知识点 CRUD API 测试。
API Key 鉴权路由级测试。
软删除和唯一约束测试。
```

里程碑 2：主题学习和待确认入库

```text
主题学习沉淀 API 测试。
待确认队列 API 测试。
确认入库状态流测试。
直接入库快捷路径测试。
```

里程碑 3：题目生成、质量校验、版本化

```text
mock AI provider 契约测试。
生成记录落库测试。
质量校验记录落库测试。
版本 active/archive 状态测试。
```

里程碑 4：答题、评分、用户修正

```text
答题提交 API 测试。
AI 评分记录测试。
用户修正评分测试。
历史版本绑定测试。
```

里程碑 5：掌握画像和错误集

```text
画像重算测试。
画像聚合测试。
错误集生成和复盘查询测试。
```

里程碑 6：外部会话沉淀 API

```text
外部 Agent API Key 鉴权测试。
上下文不足错误测试。
幂等提交测试。
确认链接生成测试。
```

里程碑 7：MCP Tool 接入

```text
MCP Server 工具注册测试。
MCP Tool 输入输出 schema 测试。
Agent 调用后端 API 测试。
Agent 聊天框返回内容长度测试。
```

## 7. 通过标准

进入下一开发阶段前，至少满足：

```text
cmd /c npm run test 通过。
cmd /c npm run build 通过。
受影响 API 或领域模块有对应测试。
涉及 Web 用户路径时，cmd /c npm run test:e2e 通过，或明确记录无法运行原因。
MCP/Agent 相关改动必须包含 schema 测试或模拟调用测试。
```

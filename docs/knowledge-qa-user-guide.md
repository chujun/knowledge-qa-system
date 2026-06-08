# 个人知识问答系统用户使用说明

日期：2026-06-07

关联文档：

```text
docs/knowledge-qa-business-model.md
docs/knowledge-qa-mcp-tools.md
docs/knowledge-qa-deployment.md
docs/knowledge-qa-test-validation.md
```

## 1. 系统用途

个人知识问答系统用于把日常生活和工作中遇到的知识沉淀成可练习、可复盘、可追踪掌握情况的问答体系。

核心目标：

```text
用户主动指定某个知识后，系统生成核心讲解、题目、答案、评分规则和质量校验结果。
用户确认后，内容进入正式题库。
用户答题后，系统记录 AI 评分、用户修正、掌握画像和错误集。
用户可以从 Codex、Claude Code 等外部 Agent 会话中沉淀知识，减少切换系统的成本。
```

## 2. 当前 MVP 骨架可用能力

当前已实现：

```text
本地 Web 首页。
健康检查 API。
mock AI provider。
领域规则单元测试。
掌握画像计算规则测试。
错误集规则测试。
API Key 鉴权规则测试。
MCP Tool schema 测试。
模拟 Agent 调用测试。
Playwright 首页 E2E 测试。
```

当前尚未实现：

```text
完整业务数据库表。
领域/主题/知识点 CRUD 页面。
题目生成和待确认页面。
答题和评分页面。
真实模型调用。
真实 MCP Server 进程。
```

## 3. 本地启动

当前 MVP 使用本地 Next.js 服务和 SQLite。Windows 环境建议始终用 `cmd /c npm ...`，避免 PowerShell 执行策略拦截 `npm.ps1`。

安装依赖：

```powershell
cmd /c npm install
```

复制本地配置：

```powershell
Copy-Item .env.example .env.local
```

`.env.local` 至少包含：

```text
DATABASE_URL="file:./dev.db"
KNOWLEDGE_QA_API_KEY="local-dev-key"
DEFAULT_AI_AGENT="Codex"
DEFAULT_MODEL_NAME="chatgpt-5.5"
```

初始化 Prisma Client 和 SQLite：

```powershell
cmd /c npm run prisma:generate
cmd /c npx prisma db push
```

开发模式启动：

```powershell
cmd /c npm run dev -- -p 3000
```

浏览器访问：

```text
http://localhost:3000
```

健康检查：

```text
http://localhost:3000/api/health
```

健康检查中 `database` 应返回：

```text
ready
```

## 4. 本地配置

复制配置模板：

```text
.env.example -> .env.local
```

`.env.local` 示例：

```text
DATABASE_URL="file:./dev.db"
KNOWLEDGE_QA_API_KEY="replace-with-local-api-key"
DEFAULT_AI_AGENT="Codex"
DEFAULT_MODEL_NAME="chatgpt-5.5"
```

注意：

```text
.env.local 不提交 Git。
KNOWLEDGE_QA_API_KEY 用于后续 API 和 Agent/MCP 调用。
真实模型 API Key 后续接入时也只放在本地环境变量中。
```

## 5. 预期业务使用方式

当前 MVP Web 工作台已经支持以下浏览器操作：

```text
待确认项确认/拒绝
知识点生成题目
题目详情查看
题目确认入库/归档
答题提交
AI 评分与反馈展示
用户确认/修正评分
掌握画像和错误集刷新
```

### 5.1 主题学习入口

适用场景：

```text
用户想系统学习一个相对完整的主题，例如 GitHub Actions、摄影曝光三要素、二战史。
```

预期路径：

```text
1. 创建或选择知识领域。
2. 创建或选择知识主题。
3. 系统拆解知识点。
4. 系统生成核心讲解、题目、答案和评分规则。
5. 系统执行质量校验。
6. 用户在待确认页面查看和编辑。
7. 用户确认后正式入库。
8. 用户开始答题和复盘。
```

### 5.2 即时掌握入口

适用场景：

```text
用户临时遇到一个知识点，只想快速理解和自测，不想完整从零学习整个主题。
```

预期路径：

```text
1. 输入临时问题或知识点。
2. 系统生成简短核心讲解。
3. 系统生成少量理解型和应用型题目。
4. 用户答题。
5. 临时题默认只作为学习记录。
6. 用户觉得有价值时，可以确认入库。
```

规则：

```text
未确认临时题不计入长期掌握画像。
临时题确认入库后，用户可选择是否补计入长期掌握画像。
```

### 5.3 外部会话沉淀入口

适用场景：

```text
用户正在 Codex、Claude Code、ChatGPT 或其他 Agent 中讨论某个知识点，突然发现这段内容值得沉淀成问答。
```

预期用户表达：

```text
把刚才关于 GitHub Actions workflow 的讨论录入知识问答系统，生成理解题和应用题。
```

Agent 预期动作：

```text
1. 调用 qa_create_from_conversation。
2. 传入 source_system、会话摘要或会话片段、用户沉淀要求。
3. 知识问答系统生成待确认沉淀任务。
4. Agent 在聊天框返回主题建议、知识点列表、题目预览和确认链接。
5. 用户点击确认链接进入知识问答系统页面编辑和确认。
```

Agent 返回示例：

```text
已生成待确认知识沉淀：
- 建议领域：计算机
- 建议主题：GitHub Actions
- 知识点：workflow 触发条件、jobs 与 steps、runner 与 secrets
- 题目预览：2 道

打开确认和编辑：
http://localhost:3000/review/ing_mock_001
```

## 6. 练习和掌握画像

预期练习方式：

```text
用户选择领域、主题或知识点。
系统优先从正式题库中选择题目。
如果薄弱维度缺少题目，系统可生成临时变式题。
用户答题后，AI 给出评分和解释。
用户可以确认或修正 AI 评分。
系统更新知识点、主题、领域三层掌握画像。
```

掌握画像维度：

```text
理解
区分
应用
分析
评价
```

错误集来源：

```text
低分答题。
用户下调 AI 评分的答题。
反复出错的知识点或认知维度。
```

## 7. 待确认队列

进入待确认队列的内容：

```text
AI 生成的题目、答案、评分规则、核心讲解。
质量校验 warning 通过但需要用户注意的内容。
来源冲突内容。
临时题准备转正式题的内容。
外部 Agent 会话沉淀内容。
```

用户可执行操作：

```text
确认入库。
编辑后确认。
拒绝。
挂载到已有主题。
保留为学习记录但不入库。
```

## 8. 质量校验规则

系统必须对 AI 生成内容做质量校验。

校验结果：

```text
passed：可以进入待确认或入库路径。
warning：允许警告通过，但用户确认时要能看到风险。
failed：进入自动修正。
failed 且超过自动修正次数：进入人工处理。
```

默认自动修正：

```text
最多 2-3 次。
超过次数后不继续让 AI 自行修，必须进入用户确认或人工处理。
```

## 9. API 和 Agent 安全

API/Agent 调用需要 API Key。

支持方式：

```text
X-API-Key: <local-api-key>
Authorization: Bearer <local-api-key>
```

不要把这些内容提交到 Git：

```text
.env.local
真实 API Key
模型 API Key
SQLite 数据库文件
包含密钥的会话原文
```

## 10. 验证命令

单元测试：

```powershell
cmd /c npm run test
```

生产构建：

```powershell
cmd /c npm run build
```

E2E 测试：

```powershell
cmd /c npm run test:e2e
```

E2E 测试会启动或复用 Playwright 专用本地服务：

```text
http://127.0.0.1:3100
```

日常浏览器使用仍然访问：

```text
http://localhost:3000
```

当前通过状态：

```text
单元测试：通过。
生产构建：通过。
E2E 测试：通过，包含首页冒烟和 MVP 浏览器学习闭环。
```

## 11. 常见问题

### npm 在 PowerShell 中无法执行

原因：

```text
Windows PowerShell 执行策略可能阻止 npm.ps1。
```

处理方式：

```powershell
cmd /c npm run test
cmd /c npm run build
cmd /c npm run dev
```

### Playwright 提示缺少 Chromium

检查路径：

```text
C:\Users\cj\AppData\Local\ms-playwright
```

当前项目需要：

```text
chromium-1223
chromium_headless_shell-1223
```

如果在线安装超时，可使用离线 zip 解压到对应目录，并确保存在：

```text
INSTALLATION_COMPLETE
```

### 健康检查返回 database=unavailable

说明：

```text
数据库不可用，通常是 DATABASE_URL 未配置、SQLite 文件不可写，或尚未执行 Prisma 初始化。
请检查 .env.local，并执行 cmd /c npx prisma db push。
```

## 12. 后续功能说明

后续里程碑会逐步实现：

```text
领域、主题、知识点管理。
主题学习沉淀。
即时掌握。
外部会话沉淀 API。
待确认队列。
正式入库。
答题和 AI 评分。
用户修正评分。
掌握画像。
错误集复盘。
真实 MCP Server。
真实模型调用。
```

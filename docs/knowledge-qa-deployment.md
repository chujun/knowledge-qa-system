# 个人知识问答系统部署运行文档

日期：2026-06-07

关联文档：

```text
docs/TODO.md
docs/knowledge-qa-architecture.md
docs/knowledge-qa-security.md
docs/knowledge-qa-observability.md
```

## 阶段：部署上线

阶段结论：

```text
MVP 第一版采用本地服务部署，不使用 Docker。
开发和试运行环境以 Windows 本机为主，后续迁移到 Linux 时保持 Node.js、SQLite、环境变量、迁移命令和健康检查方式一致。
```

已确认事项：

```text
运行环境：本地 Windows，Node.js + Next.js。
数据库：SQLite，Prisma 管理 schema 和迁移。
Web/API 服务端口：默认 http://localhost:3000。
MCP/Agent 第一阶段：先使用 schema + 本地模拟 Agent 调用；后续独立 MCP Server 可复用同一 API Key 和 HTTP API。
密钥：通过本地环境变量或 .env.local 配置，不提交到 Git。
```

待确认事项：

```text
迁移到 Linux 后是否使用 systemd 托管服务。
真实模型 chatgpt-5.5 接入时的模型网关和密钥来源。
真实 MCP Server 的进程形态：STDIO、本地 HTTP，或两者都支持。
```

风险点：

```text
SQLite 适合 MVP 单机使用，后续多设备、多用户或并发写入增加时需要评估 PostgreSQL。
本地 API Key 如果泄露，外部 Agent 可调用沉淀接口；需要避免把 .env.local、日志和终端截图提交或共享。
Playwright 浏览器依赖需要提前安装；当前已通过离线安装 Chromium Headless Shell 解决。
```

下一步动作：

```text
继续补充测试验证文档和用户使用说明。
```

## 1. 运行环境

MVP 本地运行环境：

| 项目 | 版本或约定 | 说明 |
|---|---|---|
| 操作系统 | Windows 本机 | 当前开发与试运行环境 |
| Node.js | 使用本机已安装 Node.js | 通过 `cmd /c npm` 运行，避免 PowerShell npm.ps1 执行策略问题 |
| 包管理 | npm | 使用 `package.json` 脚本 |
| Web 框架 | Next.js | 同一服务承载 Web 页面和 API |
| 语言 | TypeScript | 业务规则、API、测试统一使用 TypeScript |
| 数据库 | SQLite | MVP 本地文件数据库 |
| ORM/迁移 | Prisma | schema 位于 `prisma/schema.prisma` |
| 单元测试 | Vitest | `cmd /c npm run test` |
| E2E 测试 | Playwright Chromium | `cmd /c npm run test:e2e` |

后续 Linux 迁移建议保持：

```text
Node.js LTS
npm ci
SQLite 文件放在持久化目录
.env.local 或系统环境变量保存密钥
systemd 托管 npm run start
反向代理和 HTTPS 后续再引入
```

## 2. 数据库部署方式

MVP 使用 SQLite：

```text
DATABASE_URL="file:./dev.db"
```

当前 Prisma schema 位于：

```text
prisma/schema.prisma
```

数据库文件默认生成在 Prisma 相对目录下：

```text
prisma/dev.db
```

Git 忽略策略：

```text
prisma/dev.db
prisma/dev.db-journal
```

约束：

```text
本地 SQLite 文件不得提交到 Git。
后续迁移 PostgreSQL 时，优先通过 Prisma migration 和数据导出导入完成。
```

## 3. 配置说明

配置模板：

```text
.env.example
```

本地运行时建议创建：

```text
.env.local
```

`.env.local` 不提交 Git。

当前配置项：

| 环境变量 | 示例值 | 说明 |
|---|---|---|
| DATABASE_URL | file:./dev.db | SQLite 数据库地址 |
| KNOWLEDGE_QA_API_KEY | replace-with-local-api-key | API/Agent 调用密钥 |
| DEFAULT_AI_AGENT | Codex | 默认 AI Agent 来源 |
| DEFAULT_MODEL_NAME | chatgpt-5.5 | 默认模型名称 |

## 4. 启动命令

安装依赖：

```powershell
cmd /c npm install
```

复制本地配置：

```powershell
Copy-Item .env.example .env.local
```

MVP 本地建议使用：

```text
DATABASE_URL="file:./dev.db"
KNOWLEDGE_QA_API_KEY="local-dev-key"
DEFAULT_AI_AGENT="Codex"
DEFAULT_MODEL_NAME="chatgpt-5.5"
```

生成 Prisma Client 并初始化 SQLite：

```powershell
cmd /c npm run prisma:generate
cmd /c npx prisma db push
```

开发模式启动：

```powershell
cmd /c npm run dev -- -p 3000
```

生产构建：

```powershell
cmd /c npm run build
```

生产模式启动：

```powershell
cmd /c npm run start
```

默认访问地址：

```text
http://localhost:3000
```

健康检查地址：

```text
http://localhost:3000/api/health
```

## 5. 数据库迁移命令

生成 Prisma Client：

```powershell
cmd /c npm run prisma:generate
```

开发迁移：

```powershell
cmd /c npm run prisma:migrate
```

当前 MVP 本地试运行如果只需要把 Prisma schema 同步到 SQLite，可使用：

```powershell
cmd /c npx prisma db push
```

手工迁移目录已经包含：

```text
20260607172000_add_core_knowledge_models
20260607183000_add_ingestion_review_models
20260607184500_add_question_generation_models
20260607190000_add_attempt_mastery_models
20260607191500_add_practice_session_models
```

说明：

```text
当前 MVP 仅有基础 User model，业务表将在后续里程碑逐步实现。
每次 schema 变化后，需要同步运行迁移并更新相关文档。
```

## 6. 健康检查方式

本地浏览器访问：

```text
http://localhost:3000/api/health
```

PowerShell 验证：

```powershell
Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/api/health"
```

期望响应：

```json
{
  "data": {
    "status": "ok",
    "database": "ready",
    "database_error": null,
    "model_provider": "mock",
    "version": "0.1.0",
    "timestamp": "2026-06-08T00:00:00.000Z"
  }
}
```

## 7. 发布步骤

本地 MVP 发布步骤：

```text
1. 确认工作区无意外改动。
2. 确认 .env.local 已配置 DATABASE_URL 和 KNOWLEDGE_QA_API_KEY。
3. 安装依赖。
4. 运行单元测试。
5. 运行生产构建。
6. 运行 E2E 测试。
7. 启动生产服务。
8. 访问首页和健康检查接口。
```

对应命令：

```powershell
git status --short
cmd /c npm install
cmd /c npm run test
cmd /c npm run build
cmd /c npm run test:e2e
cmd /c npm run start
```

E2E 测试使用 Playwright 专用端口，避免和用户正在访问的 3000 开发服务互相污染：

```text
http://127.0.0.1:3100
```

日常 Web/API 服务仍使用：

```text
http://localhost:3000
```

## 8. 回滚步骤

代码回滚：

```text
优先使用 Git 回到上一个已验证提交。
不直接删除或覆盖用户未提交改动。
```

数据库回滚：

```text
MVP 使用 SQLite，本地试运行前可备份 prisma/dev.db。
回滚时停止服务，恢复备份的 dev.db。
后续引入正式迁移后，再定义 Prisma migration 回滚策略。
```

配置回滚：

```text
保留 .env.local 的上一份本地备份。
密钥轮换时，先更新知识问答系统，再更新 Agent/MCP 侧配置。
```

## 9. 冒烟测试步骤

冒烟测试清单：

```text
1. 首页能打开。
2. 健康检查返回 status=ok。
3. 单元测试全部通过。
4. 生产构建通过。
5. E2E 测试通过。
6. 模拟 Agent 调用测试通过。
```

命令：

```powershell
cmd /c npm run test
cmd /c npm run build
cmd /c npm run test:e2e
```

当前验证结果：

```text
2026-06-07 npm run test：通过，10 个测试文件，30 条测试用例。
2026-06-07 npm run build：通过。
2026-06-07 npm run test:e2e：通过，1 条 Playwright E2E 测试。
```

## 10. 密钥和隐私检查

必须遵守：

```text
.env.local 不提交 Git。
DATABASE_URL 可以出现在示例文件中，但真实路径和生产配置不写入公开文档。
KNOWLEDGE_QA_API_KEY 只能使用占位符写入 .env.example。
模型 API Key 不写入源码、测试快照、日志和文档。
外部 Agent 会话原文如果包含密钥、token、密码，进入系统前需要脱敏或人工确认。
```

当前 `.gitignore` 已覆盖：

```text
.env
.env.local
prisma/dev.db
prisma/dev.db-journal
```

## 11. 本地 API/MCP 访问方式

Web 页面：

```text
http://localhost:3000
```

HTTP API：

```text
http://localhost:3000/api
```

健康检查：

```text
http://localhost:3000/api/health
```

MCP/Agent 第一阶段：

```text
使用 src/lib/mcp/tools.ts 中的 schema 作为 Tool 契约。
使用 scripts/knowledge-qa-agent-tool.mjs 作为本地 Agent Tool CLI。
使用 scripts/knowledge-qa-mcp-stdio.mjs 作为本地 MCP stdio server。
后续完整 MCP Server 可复用同一 HTTP API 和 API Key。
```

Agent/MCP 本地环境变量：

```text
KNOWLEDGE_QA_API_BASE_URL=http://localhost:3000/api/v1
KNOWLEDGE_QA_API_KEY=<local-api-key>
```

Agent Tool CLI 自检：

```powershell
cmd /c npm run agent:tool -- --help
```

MCP stdio 自检：

```powershell
node scripts/knowledge-qa-mcp-stdio.mjs --self-check
cmd /c npm run mcp:check
```

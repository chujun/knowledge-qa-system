import packageJson from "../../../package.json";

import { appConfig } from "@/lib/config";
import { prisma } from "@/lib/db/prisma";
import { mcpToolDefinitions } from "@/lib/mcp/tools";
import { TopNav } from "@/components/top-nav";

export const dynamic = "force-dynamic";

const commands = {
  health: "Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000/api/health",
  dev: "cmd /c tmp\\start-dev-3000.cmd",
  agentTool: "npm run agent:tool -- --help",
  mcpCheck: "npm run mcp:check"
};

const envVariables = [
  {
    name: "DATABASE_URL",
    required: true,
    status: process.env.DATABASE_URL ? "已配置" : "未配置",
    description: "SQLite 数据库连接地址。本地默认可使用 file:./dev.db。"
  },
  {
    name: "KNOWLEDGE_QA_API_KEY",
    required: true,
    status: appConfig.apiKeyConfigured ? "已配置" : "未配置",
    description: "HTTP API、Agent Tool CLI 和 MCP stdio 调用认证密钥。"
  },
  {
    name: "KNOWLEDGE_QA_API_BASE_URL",
    required: false,
    status: process.env.KNOWLEDGE_QA_API_BASE_URL ? "已配置" : "使用默认值",
    description: "Agent Tool CLI 和 MCP stdio 的 API 地址，默认 http://localhost:3000/api/v1。"
  },
  {
    name: "DEFAULT_AI_AGENT",
    required: false,
    status: process.env.DEFAULT_AI_AGENT ? "已配置" : "使用默认值",
    description: "默认 AI Agent 来源，未配置时使用 Codex。"
  },
  {
    name: "DEFAULT_MODEL_NAME",
    required: false,
    status: process.env.DEFAULT_MODEL_NAME ? "已配置" : "使用默认值",
    description: "默认模型名称，未配置时使用 chatgpt-5.5。"
  }
];

const envExample = `DATABASE_URL="file:./dev.db"
KNOWLEDGE_QA_API_KEY="<local-api-key>"
KNOWLEDGE_QA_API_BASE_URL="http://localhost:3000/api/v1"
DEFAULT_AI_AGENT="Codex"
DEFAULT_MODEL_NAME="chatgpt-5.5"`;

const powershellEnv = `$env:DATABASE_URL = "file:./dev.db"
$env:KNOWLEDGE_QA_API_KEY = "<local-api-key>"
$env:KNOWLEDGE_QA_API_BASE_URL = "http://localhost:3000/api/v1"`;

export default async function SettingsPage() {
  const database = await checkDatabase();
  const settings = [
    {
      label: "应用版本",
      value: packageJson.version,
      state: "ready"
    },
    {
      label: "模型 Provider",
      value: "mock",
      state: "ready"
    },
    {
      label: "默认 AI Agent",
      value: appConfig.defaultAgent,
      state: "ready"
    },
    {
      label: "默认模型",
      value: appConfig.defaultModel,
      state: "ready"
    },
    {
      label: "API Key",
      value: appConfig.apiKeyConfigured ? "已配置" : "未配置",
      state: appConfig.apiKeyConfigured ? "ready" : "warning"
    },
    {
      label: "数据库",
      value: database.status === "ready" ? "ready" : "unavailable",
      state: database.status === "ready" ? "ready" : "warning"
    }
  ];

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-7xl px-5 py-7 lg:px-6">
        <TopNav current="设置" />

        <header className="mt-8 border-b border-ink/15 pb-6">
          <p className="text-sm uppercase tracking-[0.22em] text-moss">
            Local Settings
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none">系统设置</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/65">
            查看本地运行、默认模型、Agent/API 和 MCP 配置状态。当前页面只展示配置状态，不展示真实密钥。
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {settings.map((item) => (
            <StatusCard
              key={item.label}
              label={item.label}
              state={item.state}
              value={item.value}
            />
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel eyebrow="Runtime" title="本地运行">
            <dl className="grid gap-3 text-sm">
              <RecordKV label="服务地址" value="http://localhost:3000" />
              <RecordKV label="API Base URL" value="http://localhost:3000/api/v1" />
              <RecordKV
                label="DATABASE_URL"
                value={process.env.DATABASE_URL ? "已配置" : "未配置"}
              />
              <RecordKV label="数据库探测" value={database.message} />
            </dl>
          </Panel>

          <Panel eyebrow="Security" title="密钥与安全">
            <dl className="grid gap-3 text-sm">
              <RecordKV
                label="KNOWLEDGE_QA_API_KEY"
                value={appConfig.apiKeyConfigured ? "已配置，页面不显示真实值" : "未配置"}
              />
              <RecordKV
                label="Agent 调用认证"
                value="HTTP API 使用 x-api-key 或 Bearer Token"
              />
              <RecordKV
                label="本地文件约束"
                value=".env.local 不应提交 Git；示例文件只保留占位符"
              />
            </dl>
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel eyebrow="Agent Defaults" title="模型默认值">
            <dl className="grid gap-3 text-sm">
              <RecordKV label="DEFAULT_AI_AGENT" value={appConfig.defaultAgent} />
              <RecordKV label="DEFAULT_MODEL_NAME" value={appConfig.defaultModel} />
              <RecordKV label="当前模型实现" value="mock provider，后续可切换真实模型网关" />
            </dl>
          </Panel>

          <Panel eyebrow="MCP" title="Agent/MCP 能力">
            <dl className="grid gap-3 text-sm">
              <RecordKV label="MCP Tools" value={`${mcpToolDefinitions.length}`} />
              <RecordKV label="Agent Tool CLI" value="已提供 npm run agent:tool" />
              <RecordKV label="MCP stdio" value="已提供 npm run mcp:stdio" />
            </dl>
          </Panel>
        </section>

        <section className="mt-6">
          <Panel eyebrow="Environment" title="环境配置说明">
            <div className="grid gap-3 lg:grid-cols-2">
              {envVariables.map((item) => (
                <article className="border border-ink/15 bg-white/45 p-4" key={item.name}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="break-all font-mono text-sm font-semibold">
                      {item.name}
                    </h3>
                    <span
                      className={`whitespace-nowrap px-2 py-1 text-xs text-white ${
                        item.status === "未配置" && item.required ? "bg-clay" : "bg-moss"
                      }`}
                    >
                      {item.required ? "必填" : "可选"} · {item.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/65">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <div>
                <p className="text-sm font-semibold">.env.local 示例</p>
                <CommandBlock value={envExample} />
              </div>
              <div>
                <p className="text-sm font-semibold">PowerShell 临时配置</p>
                <CommandBlock value={powershellEnv} />
              </div>
            </div>

            <p className="text-sm leading-7 text-ink/65">
              `.env.local` 仅用于本地运行，不提交 Git；页面、日志和文档只使用占位符，不展示真实 API Key。
            </p>
          </Panel>
        </section>

        <section className="mt-6">
          <Panel eyebrow="Commands" title="本地自检命令">
            <div className="grid gap-3 lg:grid-cols-2">
              {Object.entries(commands).map(([name, command]) => (
                <article className="border border-ink/15 bg-white/45 p-4" key={name}>
                  <p className="text-xs uppercase tracking-[0.18em] text-clay">
                    {name}
                  </p>
                  <pre className="mt-3 overflow-x-auto border border-ink/15 bg-ink px-4 py-3 text-xs leading-6 text-paper">
                    <code>{command}</code>
                  </pre>
                </article>
              ))}
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ready", message: "ready" };
  } catch (error) {
    return {
      status: "unavailable",
      message: error instanceof Error ? error.message : "unknown database error"
    };
  }
}


function StatusCard({
  label,
  state,
  value
}: {
  label: string;
  state: string;
  value: string;
}) {
  return (
    <div className="border border-ink/15 bg-white/35 p-4 shadow-line">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-ink/55">{label}</p>
        <span
          className={`whitespace-nowrap px-2 py-1 text-xs text-white ${
            state === "ready" ? "bg-moss" : "bg-clay"
          }`}
        >
          {state}
        </span>
      </div>
      <p className="mt-3 break-all text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({
  children,
  eyebrow,
  title
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="border border-ink/20 bg-white/30 p-5 shadow-line">
      <p className="text-xs uppercase tracking-[0.2em] text-clay">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl leading-none">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function RecordKV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink/45">{label}</dt>
      <dd className="mt-1 break-all text-ink/75">{value}</dd>
    </div>
  );
}

function CommandBlock({ value }: { value: string }) {
  return (
    <pre className="mt-3 overflow-x-auto border border-ink/15 bg-ink px-4 py-3 text-xs leading-6 text-paper">
      <code>{value}</code>
    </pre>
  );
}


import { mcpToolDefinitions } from "@/lib/mcp/tools";
import { TopNav } from "@/components/top-nav";

export const dynamic = "force-dynamic";

const commands = {
  env: `$env:KNOWLEDGE_QA_API_BASE_URL = "http://localhost:3000/api/v1"\n$env:KNOWLEDGE_QA_API_KEY = "<your-api-key>"`,
  agentHelp: "npm run agent:tool -- --help",
  agentCreate:
    'npm run agent:tool -- qa_create_from_conversation --input-json-file .\\tmp\\agent-input.json',
  agentInputFile:
    '{ "source_system": "Codex", "source_model_name": "MiniMax-M3", "context_type": "summary", "conversation_summary": "讨论了 GitHub Actions workflow 触发条件。", "instruction": "生成理解题和应用题", "target_domain_hint": "计算机" }',
  mcpStart: "npm run mcp:stdio",
  mcpCheck: "npm run mcp:check",
  mcpCallCheck: "npm run mcp:call-check",
  claudeCodeConfig:
    '{\n  "mcpServers": {\n    "knowledge-qa": {\n      "command": "node",\n      "args": ["D:/project/my/ai/learn-qa-system/scripts/knowledge-qa-mcp-stdio.mjs"],\n      "env": {\n        "KNOWLEDGE_QA_API_BASE_URL": "http://localhost:3000/api/v1",\n        "KNOWLEDGE_QA_API_KEY": "<your-api-key>"\n      }\n    }\n  }\n}',
  apiCreate:
    'Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/v1/ingestions/external-conversation" -Headers @{ "x-api-key" = "<your-api-key>" } -ContentType "application/json" -Body \'{ "source_system": "Codex", "source_model_name": "MiniMax-M3", "context_type": "summary", "conversation_summary": "讨论了 GitHub Actions workflow 触发条件。", "instruction": "生成理解题和应用题", "target_domain_hint": "计算机" }\''
};

export default function IntegrationsPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-7xl px-5 py-7 lg:px-6">
        <TopNav current="接入" />

        <header className="mt-8 border-b border-ink/15 pb-6">
          <p className="text-sm uppercase tracking-[0.22em] text-moss">
            Agent Integration
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none">
            Agent/MCP 接入
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/65">
            外部 Agent 可以通过 HTTP API、Agent Tool CLI 或 MCP stdio 将会话内容沉淀为待确认知识问答，并返回确认链接。
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="接入方式" value={3} />
          <Metric label="MCP Tools" value={mcpToolDefinitions.length} />
          <Metric label="确认入口" value={1} />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel eyebrow="Environment" title="本地环境变量">
            <CommandBlock value={commands.env} />
            <p className="mt-3 text-sm leading-6 text-ink/65">
              API Key 从本地环境读取，不在页面、日志、Tool 输出或提交记录中展示真实值。
            </p>
          </Panel>

          <Panel eyebrow="HTTP API" title="外部会话沉淀 API">
            <dl className="grid gap-3 text-sm">
              <RecordKV label="Endpoint" value="POST /api/v1/ingestions/external-conversation" />
              <RecordKV label="Auth" value="x-api-key 或 Bearer Token" />
              <RecordKV label="Review" value="返回 review_url，用于进入待确认编辑页" />
            </dl>
            <CommandBlock value={commands.apiCreate} />
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel eyebrow="Agent Tool CLI" title="命令行 Agent Tool">
            <CommandBlock value={commands.agentHelp} />
            <CommandBlock value={commands.agentInputFile} />
            <CommandBlock value={commands.agentCreate} />
          </Panel>

          <Panel eyebrow="MCP Stdio" title="本地 MCP Server">
            <CommandBlock value={commands.mcpStart} />
            <CommandBlock value={commands.mcpCheck} />
            <CommandBlock value={commands.mcpCallCheck} />
            <CommandBlock value={commands.claudeCodeConfig} />
          </Panel>
        </section>

        <section className="mt-6">
          <Panel eyebrow="Tools" title="可用 MCP/Agent Tools">
            <div className="grid gap-3 lg:grid-cols-2">
              {mcpToolDefinitions.map((tool) => (
                <article className="border border-ink/15 bg-white/45 p-4" key={tool.name}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="break-all text-lg font-semibold">{tool.name}</h2>
                    <StatusBadge
                      label={tool.annotations.readOnlyHint ? "read only" : "write"}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/65">
                    {tool.description}
                  </p>
                </article>
              ))}
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}


function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-ink/15 bg-white/35 p-4 shadow-line">
      <p className="text-xs uppercase tracking-[0.18em] text-ink/55">{label}</p>
      <p className="mt-3 font-display text-4xl leading-none">{value}</p>
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

function CommandBlock({ value }: { value: string }) {
  return (
    <pre className="overflow-x-auto border border-ink/15 bg-ink px-4 py-3 text-xs leading-6 text-paper">
      <code>{value}</code>
    </pre>
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

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="whitespace-nowrap bg-brass px-2 py-1 text-xs text-white">
      {label}
    </span>
  );
}


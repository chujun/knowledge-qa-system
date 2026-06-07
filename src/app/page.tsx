const reviewItems = [
  { title: "GitHub Actions workflow 基础", count: "6 题", status: "待确认" },
  { title: "RAG 质量校验规则", count: "4 题", status: "待编辑" },
  { title: "AI Agent 外部会话沉淀", count: "3 题", status: "待确认" }
];

const mastery = [
  { label: "理解", value: 82 },
  { label: "区分", value: 70 },
  { label: "应用", value: 64 },
  { label: "分析", value: 58 },
  { label: "评价", value: 51 }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[320px_1fr]">
        <aside className="border-r border-ink/15 pr-0 lg:pr-8">
          <div className="sticky top-8 space-y-10">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-moss">Learn QA</p>
              <h1 className="mt-4 font-display text-5xl leading-none text-ink">
                知识问答工作台
              </h1>
            </div>

            <nav className="space-y-2 text-sm">
              {["待确认", "主题", "练习", "画像", "Agent"].map((item) => (
                <a
                  className="flex items-center justify-between border-b border-ink/15 py-3 text-ink transition hover:text-clay"
                  href={`#${item}`}
                  key={item}
                >
                  <span>{item}</span>
                  <span aria-hidden="true">-&gt;</span>
                </a>
              ))}
            </nav>

            <div className="border border-ink/20 bg-white/35 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-moss">Default Agent</p>
              <p className="mt-3 text-2xl font-semibold">Codex</p>
              <p className="mt-2 text-sm text-ink/65">chatgpt-5.5 · API Key · local service</p>
            </div>
          </div>
        </aside>

        <div className="space-y-8">
          <section className="grid gap-4 border-b border-ink/15 pb-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-clay">MVP Core Loop</p>
              <h2 className="mt-4 max-w-3xl font-display text-6xl leading-[0.95]">
                从 AI 会话里提炼知识，再用问答检验掌握。
              </h2>
            </div>
            <div className="flex flex-col justify-end text-base leading-7 text-ink/72">
              <p>
                当前骨架聚焦本地 Web + API：待确认入库、题目生成、质量校验、答题评分、
                掌握画像，以及 Agent/MCP 调用验收。
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3" id="待确认">
            {reviewItems.map((item) => (
              <article className="border border-ink/20 bg-white/40 p-5 shadow-line" key={item.title}>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-2xl leading-tight">{item.title}</h3>
                  <span className="whitespace-nowrap bg-brass px-2 py-1 text-xs text-white">
                    {item.status}
                  </span>
                </div>
                <p className="mt-8 text-sm text-ink/65">{item.count} · 来源已记录 · 需人工确认</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]" id="画像">
            <div className="border border-ink/20 bg-moss p-6 text-paper">
              <p className="text-sm uppercase tracking-[0.24em] text-paper/70">Mastery Profile</p>
              <h3 className="mt-3 font-display text-4xl">GitHub Actions</h3>
              <div className="mt-8 space-y-4">
                {mastery.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-2 bg-paper/25">
                      <div className="h-full bg-paper" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-ink/20 bg-white/45 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-clay">Next Question</p>
              <h3 className="mt-3 font-display text-4xl leading-tight">
                如果 workflow 只想在 main 分支 push 时触发，应该怎么配置？
              </h3>
              <p className="mt-8 text-sm leading-7 text-ink/70">
                系统选择这道题，是因为应用维度低于理解维度，且最近错误集中出现了 trigger
                条件缺失。
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

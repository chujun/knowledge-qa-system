import Link from "next/link";

import {
  listGenerationRecords,
  listQualityChecks,
  listSourceReferences
} from "@/lib/records/service";

export const dynamic = "force-dynamic";

export default async function RecordsPage({
  searchParams
}: {
  searchParams: Promise<{
    source_type?: string;
    source_system?: string;
    call_type?: string;
    model_name?: string;
    ai_agent?: string;
    quality_status?: string;
    checker_type?: string;
  }>;
}) {
  const filters = normalizeRecordFilters(await searchParams);
  const [sources, generations, qualityChecks, allSources, allGenerations, allQualityChecks] =
    await Promise.all([
      listSourceReferences({
        sourceType: filters.sourceType,
        sourceSystem: filters.sourceSystem,
        pageSize: 20
      }),
      listGenerationRecords({
        callType: filters.callType,
        modelName: filters.modelName,
        aiAgent: filters.aiAgent,
        pageSize: 20
      }),
      listQualityChecks({
        status: filters.qualityStatus,
        checkerType: filters.checkerType,
        pageSize: 20
      }),
      listSourceReferences({ pageSize: 1 }),
      listGenerationRecords({ pageSize: 1 }),
      listQualityChecks({ pageSize: 1 })
    ]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-7xl px-5 py-7 lg:px-6">
        <TopNav current="记录" />

        <header className="mt-8 border-b border-ink/15 pb-6">
          <p className="text-sm uppercase tracking-[0.22em] text-moss">
            Agent And Model Records
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none">
            Agent/MCP 调用记录
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/65">
            集中查看外部 Agent 会话来源、模型生成调用和质量校验记录，用于追踪来源、模型、Agent、耗时和质检结果。
          </p>
          <Link
            className="mt-5 inline-block border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay"
            href="/integrations"
          >
            查看 Agent 接入方式
          </Link>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="来源记录" value={allSources.total} />
          <Metric label="生成调用" value={allGenerations.total} />
          <Metric label="质量校验" value={allQualityChecks.total} />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-3">
          <RecordFilterPanel title="来源筛选">
            <label className="space-y-2 text-sm">
              <span className="block text-xs uppercase tracking-[0.18em] text-ink/55">
                来源系统
              </span>
              <input
                aria-label="来源系统"
                className="w-full border border-ink/20 bg-white/75 px-3 py-2 outline-none focus:border-clay"
                defaultValue={filters.sourceSystem ?? ""}
                name="source_system"
                placeholder="例如 Codex"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="block text-xs uppercase tracking-[0.18em] text-ink/55">
                来源类型
              </span>
              <input
                aria-label="来源类型"
                className="w-full border border-ink/20 bg-white/75 px-3 py-2 outline-none focus:border-clay"
                defaultValue={filters.sourceType ?? ""}
                name="source_type"
                placeholder="例如 external_conversation"
              />
            </label>
            <FilterActions submitLabel="筛选来源" />
          </RecordFilterPanel>

          <RecordFilterPanel title="生成筛选">
            <label className="space-y-2 text-sm">
              <span className="block text-xs uppercase tracking-[0.18em] text-ink/55">
                AI Agent
              </span>
              <input
                aria-label="生成 AI Agent"
                className="w-full border border-ink/20 bg-white/75 px-3 py-2 outline-none focus:border-clay"
                defaultValue={filters.aiAgent ?? ""}
                name="ai_agent"
                placeholder="例如 Codex"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="block text-xs uppercase tracking-[0.18em] text-ink/55">
                模型
              </span>
              <input
                aria-label="生成模型"
                className="w-full border border-ink/20 bg-white/75 px-3 py-2 outline-none focus:border-clay"
                defaultValue={filters.modelName ?? ""}
                name="model_name"
                placeholder="例如 chatgpt-5.5"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="block text-xs uppercase tracking-[0.18em] text-ink/55">
                调用类型
              </span>
              <input
                aria-label="调用类型"
                className="w-full border border-ink/20 bg-white/75 px-3 py-2 outline-none focus:border-clay"
                defaultValue={filters.callType ?? ""}
                name="call_type"
                placeholder="例如 question_generation"
              />
            </label>
            <FilterActions submitLabel="筛选生成" />
          </RecordFilterPanel>

          <RecordFilterPanel title="质检筛选">
            <label className="space-y-2 text-sm">
              <span className="block text-xs uppercase tracking-[0.18em] text-ink/55">
                质检状态
              </span>
              <select
                aria-label="质检状态"
                className="w-full border border-ink/20 bg-white/75 px-3 py-2 outline-none focus:border-clay"
                defaultValue={filters.qualityStatus ?? ""}
                name="quality_status"
              >
                <option value="">全部状态</option>
                <option value="passed">已通过</option>
                <option value="failed">未通过</option>
                <option value="pending">待处理</option>
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="block text-xs uppercase tracking-[0.18em] text-ink/55">
                质检类型
              </span>
              <input
                aria-label="质检类型"
                className="w-full border border-ink/20 bg-white/75 px-3 py-2 outline-none focus:border-clay"
                defaultValue={filters.checkerType ?? ""}
                name="checker_type"
                placeholder="例如 question_quality"
              />
            </label>
            <FilterActions submitLabel="筛选质检" />
          </RecordFilterPanel>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel
            empty={sources.items.length === 0}
            emptyText="暂无来源记录。通过 Agent Tool、MCP 或外部会话沉淀 API 提交内容后会出现在这里。"
            eyebrow="Source References"
            title={`Agent 会话来源 · ${sources.total}`}
          >
            <div className="space-y-3">
              {sources.items.map((item) => (
                <article className="border border-ink/15 bg-white/45 p-4" key={item.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {item.source_system ?? "未知来源系统"}
                      </h2>
                      <p className="mt-1 text-xs text-ink/55">
                        {item.source_type} · {formatDate(item.created_at)}
                      </p>
                    </div>
                    <StatusBadge label={item.trust_level} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/70">
                    {item.source_summary || item.source_title || "未提供摘要"}
                  </p>
                  <p className="mt-3 text-xs text-ink/55">
                    会话 ID：{item.conversation_id ?? "无"} · 原文长度{" "}
                    {item.source_content_length}
                  </p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel
            empty={generations.items.length === 0}
            emptyText="暂无生成调用记录。生成题目、答案、评分规则或核心讲解后会出现在这里。"
            eyebrow="Generation Records"
            title={`模型生成调用 · ${generations.total}`}
          >
            <div className="space-y-3">
              {generations.items.map((item) => (
                <article className="border border-ink/15 bg-white/45 p-4" key={item.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{item.call_type}</h2>
                      <p className="mt-1 text-xs text-ink/55">
                        {item.target_type} · {formatDate(item.created_at)}
                      </p>
                    </div>
                    <StatusBadge label={item.status} />
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <RecordKV label="AI Agent" value={item.ai_agent} />
                    <RecordKV label="模型" value={item.model_name} />
                    <RecordKV label="模型版本" value={item.model_version ?? "无"} />
                    <RecordKV label="Prompt" value={item.prompt_version} />
                    <RecordKV
                      label="Token"
                      value={`${item.input_tokens ?? 0} / ${item.output_tokens ?? 0}`}
                    />
                    <RecordKV
                      label="耗时"
                      value={item.latency_ms === null ? "无" : `${item.latency_ms} ms`}
                    />
                  </dl>
                </article>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-6">
          <Panel
            empty={qualityChecks.items.length === 0}
            emptyText="暂无质量校验记录。题目生成质检后会出现在这里。"
            eyebrow="Quality Checks"
            title={`质量校验记录 · ${qualityChecks.total}`}
          >
            <div className="grid gap-3 lg:grid-cols-2">
              {qualityChecks.items.map((item) => (
                <article className="border border-ink/15 bg-white/45 p-4" key={item.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{item.checker_type}</h2>
                      <p className="mt-1 text-xs text-ink/55">
                        {item.target_type} · {formatDate(item.created_at)}
                      </p>
                    </div>
                    <StatusBadge label={item.status} />
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <RecordKV label="AI Agent" value={item.ai_agent ?? "无"} />
                    <RecordKV label="模型" value={item.model_name ?? "无"} />
                    <RecordKV label="自动修正" value={`${item.auto_fix_count} 次`} />
                    <RecordKV
                      label="通过时间"
                      value={item.passed_at ? formatDate(item.passed_at) : "未通过"}
                    />
                  </dl>
                </article>
              ))}
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

function TopNav({ current }: { current: string }) {
  const items = [
    ["/", "工作台"],
    ["/domains", "知识结构"],
    ["/questions", "题库"],
    ["/practice", "练习"],
    ["/mastery", "画像"],
    ["/attempts", "答题记录"],
    ["/error-sets", "错误集"],
    ["/records", "记录"]
  ];

  return (
    <nav className="flex flex-wrap gap-2 text-sm">
      {items.map(([href, label]) => (
        <Link
          className={`border px-3 py-2 transition ${
            label === current
              ? "border-ink bg-ink text-paper"
              : "border-ink/20 bg-white/50 text-ink hover:border-clay hover:text-clay"
          }`}
          href={href}
          key={href}
        >
          {label}
        </Link>
      ))}
    </nav>
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

function RecordFilterPanel({
  children,
  title
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <form className="space-y-3 border border-ink/15 bg-white/35 p-4 shadow-line" method="get">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </form>
  );
}

function FilterActions({ submitLabel }: { submitLabel: string }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <button className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
        {submitLabel}
      </button>
      <Link
        className="border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay"
        href="/records"
      >
        清除
      </Link>
    </div>
  );
}

function Panel({
  children,
  empty,
  emptyText,
  eyebrow,
  title
}: {
  children: React.ReactNode;
  empty: boolean;
  emptyText: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="border border-ink/20 bg-white/30 p-5 shadow-line">
      <p className="text-xs uppercase tracking-[0.2em] text-clay">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl leading-none">{title}</h2>
      <div className="mt-5">
        {empty ? <p className="text-sm leading-7 text-ink/65">{emptyText}</p> : children}
      </div>
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

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="whitespace-nowrap bg-brass px-2 py-1 text-xs text-white">
      {label}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function normalizeRecordFilters(params: {
  source_type?: string;
  source_system?: string;
  call_type?: string;
  model_name?: string;
  ai_agent?: string;
  quality_status?: string;
  checker_type?: string;
}) {
  return {
    sourceType: normalizeFilterValue(params.source_type),
    sourceSystem: normalizeFilterValue(params.source_system),
    callType: normalizeFilterValue(params.call_type),
    modelName: normalizeFilterValue(params.model_name),
    aiAgent: normalizeFilterValue(params.ai_agent),
    qualityStatus: normalizeFilterValue(params.quality_status),
    checkerType: normalizeFilterValue(params.checker_type)
  };
}

function normalizeFilterValue(value: string | undefined) {
  return value && value.trim().length > 0 ? value : null;
}

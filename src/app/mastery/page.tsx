import Link from "next/link";

import { listMasteryProfiles } from "@/lib/practice/service";

export const dynamic = "force-dynamic";

const dimensionLabels: Record<string, string> = {
  understand: "理解",
  distinguish: "区分",
  apply: "应用",
  analyze: "分析",
  evaluate: "评价"
};

export default async function MasteryPage() {
  const [profiles, pointProfiles, topicProfiles, domainProfiles] = await Promise.all([
    listMasteryProfiles({ pageSize: 50 }),
    listMasteryProfiles({ targetType: "knowledge_point", pageSize: 1 }),
    listMasteryProfiles({ targetType: "topic", pageSize: 1 }),
    listMasteryProfiles({ targetType: "domain", pageSize: 1 })
  ]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-6xl px-5 py-7 lg:px-6">
        <TopNav current="画像" />

        <header className="mt-8 border-b border-ink/15 pb-6">
          <p className="text-sm uppercase tracking-[0.22em] text-moss">
            Mastery Profiles
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none">掌握画像</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/65">
            集中查看知识点、主题和领域维度的五维掌握分、综合分、薄弱维度和证据数量，用于决定下一轮针对性练习。
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric label="全部画像" value={profiles.total} />
          <Metric label="知识点" value={pointProfiles.total} />
          <Metric label="主题" value={topicProfiles.total} />
          <Metric label="领域" value={domainProfiles.total} />
        </section>

        <section className="mt-8">
          {profiles.items.length === 0 ? (
            <EmptyState text="暂无掌握画像。完成一次正式题答题并确认评分后，系统会生成知识点级掌握画像。" />
          ) : (
            <div className="space-y-4">
              {profiles.items.map((profile) => (
                <article
                  className="border border-ink/20 bg-white/30 p-5 shadow-line"
                  key={profile.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge label={profile.status} />
                        <StatusBadge label={profile.target_type} />
                        <StatusBadge label={`${profile.evidence_count} 条证据`} />
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold leading-snug">
                        {profile.target_name ?? profile.target_id}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-ink/65">
                        薄弱维度：
                        {profile.weak_dimensions.length > 0
                          ? profile.weak_dimensions
                              .map((dimension) => dimensionLabels[dimension] ?? dimension)
                              .join(" / ")
                          : "暂无"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-ink/45">
                        Overall
                      </p>
                      <p className="mt-2 font-display text-5xl leading-none">
                        {Math.round(profile.overall_score)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-5">
                    {Object.entries(dimensionLabels).map(([dimension, label]) => {
                      const value = Number(profile.dimension_scores[dimension] ?? 0);
                      return (
                        <div key={dimension}>
                          <div className="mb-2 flex justify-between text-sm">
                            <span>{label}</span>
                            <span>{Math.round(value)}</span>
                          </div>
                          <div className="h-2 bg-ink/10">
                            <div
                              className="h-full bg-moss"
                              style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4 text-xs text-ink/55">
                    <span>更新 {formatDate(profile.updated_at)}</span>
                    {profile.target_type === "knowledge_point" ? (
                      <Link
                        className="border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay"
                        href={`/practice?knowledge_point_id=${profile.target_id}`}
                      >
                        针对练习
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
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

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="whitespace-nowrap bg-brass px-2 py-1 text-xs text-white">
      {label}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-ink/20 bg-white/30 p-5 text-sm leading-7 text-ink/65 shadow-line">
      {text}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

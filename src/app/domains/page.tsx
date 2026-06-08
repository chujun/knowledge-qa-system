import { revalidatePath } from "next/cache";
import Link from "next/link";

import {
  listDomains,
  listKnowledgePoints,
  listTopics
} from "@/lib/knowledge/service";
import { generateForKnowledgePoint } from "@/lib/questions/service";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const [domains, topics, points] = await Promise.all([
    listDomains({ pageSize: 50 }),
    listTopics({ pageSize: 100 }),
    listKnowledgePoints({ pageSize: 100 })
  ]);

  const topicsByDomain = groupBy(topics.items, "domain_id");
  const pointsByTopic = groupBy(points.items, "topic_id");

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-6xl px-5 py-7 lg:px-6">
        <TopNav current="知识结构" />

        <header className="mt-8 border-b border-ink/15 pb-6">
          <p className="text-sm uppercase tracking-[0.22em] text-moss">
            Knowledge Structure
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none">知识结构管理</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/65">
            这里按领域、主题和知识点展示真实数据。知识点可以直接生成理解和应用题，生成后进入题库待确认流程。
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="领域" value={domains.total} />
          <Metric label="主题" value={topics.total} />
          <Metric label="知识点" value={points.total} />
        </section>

        <section className="mt-8 space-y-5">
          {domains.items.length === 0 ? (
            <EmptyState
              text="暂无知识领域。请回到首页先创建领域、主题和知识点。"
            />
          ) : (
            domains.items.map((domain) => {
              const domainTopics = topicsByDomain.get(domain.id) ?? [];
              return (
                <article
                  className="border border-ink/20 bg-white/30 p-5 shadow-line"
                  key={domain.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-clay">
                        Domain
                      </p>
                      <h2 className="mt-2 font-display text-4xl leading-none">
                        {domain.name}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-ink/65">
                        {domain.description || "尚未补充领域说明"}
                      </p>
                    </div>
                    <StatusBadge label={domain.status} />
                  </div>

                  <div className="mt-5 space-y-4">
                    {domainTopics.length === 0 ? (
                      <p className="text-sm leading-7 text-ink/60">
                        该领域下暂无主题。
                      </p>
                    ) : (
                      domainTopics.map((topic) => {
                        const topicPoints = pointsByTopic.get(topic.id) ?? [];
                        return (
                          <section
                            className="border border-ink/10 bg-white/35 p-4"
                            key={topic.id}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.16em] text-moss">
                                  Topic
                                </p>
                                <h3 className="mt-2 text-2xl font-semibold">
                                  {topic.name}
                                </h3>
                              </div>
                              <StatusBadge label={topic.status} />
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              {topicPoints.length === 0 ? (
                                <p className="text-sm leading-7 text-ink/60">
                                  该主题下暂无知识点。
                                </p>
                              ) : (
                                topicPoints.map((point) => (
                                  <article
                                    className="border border-ink/10 bg-white/50 p-4"
                                    key={point.id}
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <h4 className="text-lg font-semibold">
                                          {point.name}
                                        </h4>
                                        <p className="mt-2 text-xs text-ink/55">
                                          {point.knowledge_type?.name ?? "未标注类型"} · 难度{" "}
                                          {point.suggested_difficulty}
                                        </p>
                                      </div>
                                      <StatusBadge label={point.status} />
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-ink/65">
                                      {point.description || "尚未补充知识点说明"}
                                    </p>
                                    <form action={generateQuestionsAction} className="mt-4">
                                      <input
                                        name="knowledge_point_id"
                                        type="hidden"
                                        value={point.id}
                                      />
                                      <button className="border border-clay bg-clay px-3 py-2 text-sm text-paper transition hover:bg-ink">
                                        生成题目
                                      </button>
                                    </form>
                                  </article>
                                ))
                              )}
                            </div>
                          </section>
                        );
                      })
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </section>
    </main>
  );
}

async function generateQuestionsAction(formData: FormData) {
  "use server";

  const knowledgePointId = getRequiredFormValue(formData, "knowledge_point_id");
  await generateForKnowledgePoint({
    knowledge_point_id: knowledgePointId,
    cognitive_dimensions: ["understand", "apply"],
    question_count: 2,
    direct_confirm: false
  });
  revalidatePath("/");
  revalidatePath("/domains");
  revalidatePath("/questions");
}

function TopNav({ current }: { current: string }) {
  const items = [
    ["/", "工作台"],
    ["/domains", "知识结构"],
    ["/questions", "题库"],
    ["/practice", "练习"]
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

function groupBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const value = String(item[key]);
    grouped.set(value, [...(grouped.get(value) ?? []), item]);
  }
  return grouped;
}

function getRequiredFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name}_required`);
  }

  return value;
}

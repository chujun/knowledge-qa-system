import { redirect } from "next/navigation";
import Link from "next/link";

import { listKnowledgePoints } from "@/lib/knowledge/service";
import {
  createPracticeSession,
  listErrorSets,
  listMasteryProfiles
} from "@/lib/practice/service";
import { listQuestions } from "@/lib/questions/service";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const [points, confirmedQuestions, mastery, errorSets] = await Promise.all([
    listKnowledgePoints({ status: "confirmed", pageSize: 100 }),
    listQuestions({ status: "confirmed", pageSize: 1 }),
    listMasteryProfiles({ pageSize: 20 }),
    listErrorSets({ status: "active", pageSize: 20 })
  ]);

  const canCreatePractice =
    points.items.length > 0 && confirmedQuestions.total > 0;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-6xl px-5 py-7 lg:px-6">
        <TopNav current="练习" />

        <header className="mt-8 border-b border-ink/15 pb-6">
          <p className="text-sm uppercase tracking-[0.22em] text-moss">
            Targeted Practice
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none">针对性练习</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/65">
            练习会优先使用正式入库题目，并结合薄弱维度和活跃错误集选择题目。当前版本先创建练习会话，再进入题目详情页答题。
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="正式题" value={confirmedQuestions.total} />
          <Metric label="掌握画像" value={mastery.total} />
          <Metric label="活跃错误集" value={errorSets.total} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Panel title="创建练习" eyebrow="Create Session">
            {canCreatePractice ? (
              <form action={createPracticeSessionAction} className="space-y-4">
                <label className="grid gap-2 text-sm">
                  <span className="text-ink/60">练习知识点</span>
                  <select
                    aria-label="练习知识点"
                    className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                    name="target_id"
                    required
                  >
                    {points.items.map((point) => (
                      <option key={point.id} value={point.id}>
                        {point.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm">
                  <span className="text-ink/60">题目数量</span>
                  <input
                    aria-label="练习题目数量"
                    className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                    defaultValue={3}
                    max={20}
                    min={1}
                    name="question_count"
                    type="number"
                  />
                </label>

                <label className="flex items-center gap-3 text-sm">
                  <input defaultChecked name="include_error_set" type="checkbox" />
                  <span>优先纳入活跃错误集</span>
                </label>

                <label className="flex items-center gap-3 text-sm">
                  <input defaultChecked name="prefer_weak_dimensions" type="checkbox" />
                  <span>优先薄弱认知维度</span>
                </label>

                <button className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                  创建练习
                </button>
              </form>
            ) : (
              <p className="text-sm leading-7 text-ink/65">
                暂时无法创建练习。需要至少一个知识点和一条已确认入库的正式题。
              </p>
            )}
          </Panel>

          <Panel title="练习依据" eyebrow="Signals">
            <div className="space-y-4">
              <SignalList
                emptyText="暂无掌握画像。完成一次答题并确认评分后会生成。"
                items={mastery.items.map((item) => ({
                  id: item.id,
                  title: `${item.target_type} · ${item.target_id}`,
                  detail: `总体掌握 ${item.overall_score}，证据 ${item.evidence_count} 条`
                }))}
              />
              <SignalList
                emptyText="暂无活跃错误集。低分答题后会自动归集。"
                items={errorSets.items.map((item) => ({
                  id: item.id,
                  title: `错误集 · ${item.status}`,
                  detail:
                    item.dominant_tags.length > 0
                      ? item.dominant_tags.join(" / ")
                      : "暂无主导错误标签"
                }))}
              />
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

async function createPracticeSessionAction(formData: FormData) {
  "use server";

  const rawCount = getRequiredFormValue(formData, "question_count");
  const questionCount = Number(rawCount);

  if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 20) {
    throw new Error("question_count_invalid");
  }

  const session = await createPracticeSession({
    session_type: "knowledge_point",
    target_type: "knowledge_point",
    target_id: getRequiredFormValue(formData, "target_id"),
    strategy: {
      include_error_set: formData.get("include_error_set") === "on",
      prefer_weak_dimensions: formData.get("prefer_weak_dimensions") === "on",
      question_count: questionCount
    }
  });

  redirect(`/practice/${session.id}`);
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
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SignalList({
  emptyText,
  items
}: {
  emptyText: string;
  items: Array<{ id: string; title: string; detail: string }>;
}) {
  if (items.length === 0) {
    return <p className="text-sm leading-7 text-ink/65">{emptyText}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <article className="border border-ink/10 bg-white/45 p-3" key={item.id}>
          <h3 className="text-sm font-semibold">{item.title}</h3>
          <p className="mt-1 text-xs leading-5 text-ink/60">{item.detail}</p>
        </article>
      ))}
    </div>
  );
}

function getRequiredFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name}_required`);
  }

  return value;
}

import { revalidatePath } from "next/cache";
import Link from "next/link";

import {
  archiveQuestion,
  confirmQuestion,
  listQuestions
} from "@/lib/questions/service";

export const dynamic = "force-dynamic";

const dimensionLabels: Record<string, string> = {
  understand: "理解",
  distinguish: "区分",
  apply: "应用",
  analyze: "分析",
  evaluate: "评价"
};

export default async function QuestionsPage() {
  const [allQuestions, pendingQuestions, confirmedQuestions] = await Promise.all([
    listQuestions({ pageSize: 50 }),
    listQuestions({ status: "pending_confirmation", pageSize: 1 }),
    listQuestions({ status: "confirmed", pageSize: 1 })
  ]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-6xl px-5 py-7 lg:px-6">
        <TopNav current="题库" />

        <header className="mt-8 border-b border-ink/15 pb-6">
          <p className="text-sm uppercase tracking-[0.22em] text-moss">
            Question Bank
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none">题库管理</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/65">
            这里集中展示题目状态、认知维度和难度。待确认题可以确认入库，正式题可以进入详情页答题。
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="全部题目" value={allQuestions.total} />
          <Metric label="待确认" value={pendingQuestions.total} />
          <Metric label="正式题" value={confirmedQuestions.total} />
        </section>

        <section className="mt-8">
          {allQuestions.items.length === 0 ? (
            <EmptyState text="暂无题目。请先到知识结构页或首页围绕知识点生成题目。" />
          ) : (
            <div className="space-y-3">
              {allQuestions.items.map((question) => (
                <article
                  className="border border-ink/20 bg-white/30 p-5 shadow-line"
                  key={question.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge label={question.status} />
                        <StatusBadge
                          label={
                            dimensionLabels[question.cognitive_dimension] ??
                            question.cognitive_dimension
                          }
                        />
                        <StatusBadge label={`难度 ${question.difficulty_level}`} />
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold leading-snug">
                        {question.question_version?.stem ?? "题干版本缺失"}
                      </h2>
                      <p className="mt-3 text-xs text-ink/55">
                        创建 {formatDate(question.created_at)} · 更新{" "}
                        {formatDate(question.updated_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay"
                        href={`/questions/${question.id}`}
                      >
                        查看详情
                      </Link>
                      {question.status !== "confirmed" ? (
                        <form action={confirmQuestionAction}>
                          <input name="question_id" type="hidden" value={question.id} />
                          <button className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                            确认入库
                          </button>
                        </form>
                      ) : null}
                      {question.status !== "archived" ? (
                        <form action={archiveQuestionAction}>
                          <input name="question_id" type="hidden" value={question.id} />
                          <button className="border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay">
                            归档
                          </button>
                        </form>
                      ) : null}
                    </div>
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

async function confirmQuestionAction(formData: FormData) {
  "use server";

  const questionId = getRequiredFormValue(formData, "question_id");
  await confirmQuestion(questionId);
  revalidatePath("/");
  revalidatePath("/questions");
  revalidatePath(`/questions/${questionId}`);
}

async function archiveQuestionAction(formData: FormData) {
  "use server";

  const questionId = getRequiredFormValue(formData, "question_id");
  await archiveQuestion(questionId);
  revalidatePath("/");
  revalidatePath("/questions");
  revalidatePath(`/questions/${questionId}`);
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

function getRequiredFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name}_required`);
  }

  return value;
}

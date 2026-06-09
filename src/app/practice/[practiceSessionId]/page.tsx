import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPracticeSession,
  submitPracticeSessionItemAnswer
} from "@/lib/practice/service";

export const dynamic = "force-dynamic";

const dimensionLabels: Record<string, string> = {
  understand: "理解",
  distinguish: "区分",
  apply: "应用",
  analyze: "分析",
  evaluate: "评价"
};

export default async function PracticeSessionPage({
  params
}: {
  params: Promise<{ practiceSessionId: string }>;
}) {
  const { practiceSessionId } = await params;
  const session = await getPracticeSession(practiceSessionId);

  if (!session) {
    notFound();
  }

  const currentQuestion =
    session.questions.find((question) => question.status !== "answered") ??
    session.questions[0];

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-5xl px-5 py-7 lg:px-6">
        <TopNav current="练习" />

        <header className="mt-8 border-b border-ink/15 pb-6">
          <p className="text-sm uppercase tracking-[0.22em] text-moss">
            Practice Session
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none">练习会话</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge label={session.status} />
            <StatusBadge label={session.session_type} />
            <StatusBadge label={`${session.questions.length} 题`} />
          </div>
          <p className="mt-4 text-sm leading-7 text-ink/65">
            创建时间 {formatDate(session.created_at)}。当前页面支持连续答题，提交后会立即显示 AI 评分并推进下一题。
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="总题数" value={session.progress.total} />
          <Metric label="已完成" value={session.progress.answered} />
          <Metric label="待完成" value={session.progress.pending} />
        </section>

        {currentQuestion ? (
          <section className="mt-8 border border-ink/20 bg-white/35 p-5 shadow-line">
            <p className="text-xs uppercase tracking-[0.2em] text-clay">
              Current Question
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge label={`#${currentQuestion.order_no}`} />
              <StatusBadge
                label={
                  dimensionLabels[currentQuestion.cognitive_dimension] ??
                  currentQuestion.cognitive_dimension
                }
              />
              <StatusBadge label={`难度 ${currentQuestion.difficulty_level}`} />
              <StatusBadge label={currentQuestion.status} />
            </div>

            <h2 className="mt-5 text-3xl font-semibold leading-snug">
              {currentQuestion.stem || "题干版本缺失"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              选题原因：{currentQuestion.selection_reason}
            </p>

            {currentQuestion.status === "answered" ? (
              <AttemptSummary attempt={currentQuestion.latest_attempt} />
            ) : (
              <form action={submitPracticeAnswerAction} className="mt-6 space-y-4">
                <input
                  name="practice_session_id"
                  type="hidden"
                  value={session.id}
                />
                <input
                  name="practice_session_item_id"
                  type="hidden"
                  value={currentQuestion.practice_session_item_id}
                />
                <textarea
                  aria-label="练习答案"
                  className="min-h-36 w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm leading-6 outline-none focus:border-clay"
                  name="user_answer"
                  placeholder="输入你的答案，提交后系统会进行 mock AI 评分并进入下一题。"
                  required
                />
                <button className="border border-moss bg-moss px-4 py-2 text-sm text-paper transition hover:bg-ink">
                  提交本题
                </button>
              </form>
            )}
          </section>
        ) : null}

        <section className="mt-8 space-y-4">
          {session.questions.map((question) => (
            <article
              className="border border-ink/20 bg-white/30 p-5 shadow-line"
              key={question.practice_session_item_id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={`#${question.order_no}`} />
                    <StatusBadge
                      label={
                        dimensionLabels[question.cognitive_dimension] ??
                        question.cognitive_dimension
                      }
                    />
                    <StatusBadge label={`难度 ${question.difficulty_level}`} />
                    <StatusBadge label={question.status} />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold leading-snug">
                    {question.stem || "题干版本缺失"}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-ink/65">
                    选题原因：{question.selection_reason}
                  </p>
                  {question.latest_attempt ? (
                    <p className="mt-3 text-sm text-moss">
                      最近得分 {question.latest_attempt.final_score} ·{" "}
                      {question.latest_attempt.status}
                    </p>
                  ) : null}
                </div>
                <Link
                  className="border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay"
                  href={`/questions/${question.question_id}`}
                >
                  查看详情
                </Link>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

async function submitPracticeAnswerAction(formData: FormData) {
  "use server";

  const practiceSessionId = getRequiredFormValue(formData, "practice_session_id");

  await submitPracticeSessionItemAnswer(
    practiceSessionId,
    getRequiredFormValue(formData, "practice_session_item_id"),
    {
      user_answer: getRequiredFormValue(formData, "user_answer"),
      affects_mastery: true
    }
  );

  revalidatePath(`/practice/${practiceSessionId}`);
  revalidatePath("/");
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

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="whitespace-nowrap bg-brass px-2 py-1 text-xs text-white">
      {label}
    </span>
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

function AttemptSummary({
  attempt
}: {
  attempt: {
    final_score: number;
    ai_feedback: string;
    status: string;
  } | null;
}) {
  if (!attempt) {
    return (
      <p className="mt-5 text-sm leading-7 text-ink/65">
        本题已完成，但暂未找到最近评分记录。
      </p>
    );
  }

  return (
    <div className="mt-6 border border-moss/30 bg-white/55 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-moss">Latest Score</p>
      <p className="mt-3 text-3xl font-semibold">{attempt.final_score}</p>
      <p className="mt-2 text-sm leading-6 text-ink/70">{attempt.ai_feedback}</p>
      <p className="mt-2 text-xs text-ink/55">{attempt.status}</p>
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

  return value.trim();
}

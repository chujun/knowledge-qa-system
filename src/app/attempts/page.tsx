import Link from "next/link";

import { listAnswerAttempts } from "@/lib/practice/service";

export const dynamic = "force-dynamic";

const dimensionLabels: Record<string, string> = {
  understand: "理解",
  distinguish: "区分",
  apply: "应用",
  analyze: "分析",
  evaluate: "评价"
};

const statusLabels: Record<string, string> = {
  ai_scored: "AI 已评分",
  user_confirmed: "用户已确认"
};

export default async function AttemptsPage() {
  const [attempts, aiScoredAttempts, confirmedAttempts] = await Promise.all([
    listAnswerAttempts({ pageSize: 50 }),
    listAnswerAttempts({ status: "ai_scored", pageSize: 1 }),
    listAnswerAttempts({ status: "user_confirmed", pageSize: 1 })
  ]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-6xl px-5 py-7 lg:px-6">
        <TopNav current="答题记录" />

        <header className="mt-8 border-b border-ink/15 pb-6">
          <p className="text-sm uppercase tracking-[0.22em] text-moss">
            Answer Attempts
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none">答题记录</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/65">
            回看每一次答题时绑定的题目版本、用户答案、AI 评分、用户确认评分和错误标签，用于复盘学习过程。
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="全部记录" value={attempts.total} />
          <Metric label="AI 已评分" value={aiScoredAttempts.total} />
          <Metric label="用户已确认" value={confirmedAttempts.total} />
        </section>

        <section className="mt-8">
          {attempts.items.length === 0 ? (
            <EmptyState text="暂无答题记录。进入题目详情或练习会话提交答案后，这里会显示历史记录。" />
          ) : (
            <div className="space-y-4">
              {attempts.items.map((attempt) => (
                <article
                  className="border border-ink/20 bg-white/30 p-5 shadow-line"
                  key={attempt.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge label={statusLabels[attempt.status] ?? attempt.status} />
                        <StatusBadge
                          label={
                            dimensionLabels[attempt.question.cognitive_dimension] ??
                            attempt.question.cognitive_dimension
                          }
                        />
                        <StatusBadge label={`难度 ${attempt.question.difficulty_level}`} />
                        {attempt.affects_mastery ? (
                          <StatusBadge label="计入画像" />
                        ) : (
                          <StatusBadge label="仅学习记录" />
                        )}
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold leading-snug">
                        {attempt.question_version.stem}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-ink/65">
                        回答：{attempt.user_answer}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-ink/45">
                        Score
                      </p>
                      <p className="mt-2 font-display text-5xl leading-none">
                        {attempt.final_score ?? attempt.ai_score ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-ink/10 pt-4 lg:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-clay">
                        AI Feedback
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ink/65">
                        {attempt.ai_feedback ?? "暂无 AI 反馈"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-clay">
                        Score Confirmation
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ink/65">
                        用户确认：
                        {attempt.user_confirmed_score === null
                          ? "尚未确认"
                          : `${attempt.user_confirmed_score} 分`}
                        {attempt.score_diff_reason
                          ? ` · ${attempt.score_diff_reason}`
                          : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-clay">
                        Tags
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ink/65">
                        {attempt.reason_tags.length > 0
                          ? attempt.reason_tags.join(" / ")
                          : "暂无错误标签"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4 text-xs text-ink/55">
                    <span>提交 {formatDate(attempt.created_at)}</span>
                    <Link
                      className="border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay"
                      href={`/questions/${attempt.question_id}`}
                    >
                      查看题目
                    </Link>
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

import Link from "next/link";
import { notFound } from "next/navigation";

import { getPracticeSession } from "@/lib/practice/service";

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
            创建时间 {formatDate(session.created_at)}。点击题目即可进入详情页答题，答题后掌握画像和错误集会刷新。
          </p>
        </header>

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
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold leading-snug">
                    {question.stem || "题干版本缺失"}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-ink/65">
                    选题原因：{question.selection_reason}
                  </p>
                </div>
                <Link
                  className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink"
                  href={`/questions/${question.question_id}`}
                >
                  去答题
                </Link>
              </div>
            </article>
          ))}
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

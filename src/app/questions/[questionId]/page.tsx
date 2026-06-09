import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import {
  confirmScore,
  listAnswerAttempts,
  submitAnswerAttempt
} from "@/lib/practice/service";
import {
  archiveQuestion,
  confirmQuestion,
  getCoreExplanationForKnowledgePoint,
  getQuestion,
  updateCoreExplanationContent,
  updateQuestionContent
} from "@/lib/questions/service";

export const dynamic = "force-dynamic";

const dimensionLabels: Record<string, string> = {
  understand: "理解",
  distinguish: "区分",
  apply: "应用",
  analyze: "分析",
  evaluate: "评价"
};

export default async function QuestionDetailPage({
  params
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  const question = await getQuestion(questionId);

  if (!question) {
    notFound();
  }

  const attempts = await listAnswerAttempts({ questionId, pageSize: 5 });
  const coreExplanation = await getCoreExplanationForKnowledgePoint(
    question.knowledge_point_id
  );
  const activeAnswerVersion = question.answer_versions[0];
  const rubricJson = JSON.stringify(
    question.scoring_rubric_version?.rubric ?? {},
    null,
    2
  );

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-5xl px-5 py-7 lg:px-6">
        <Link className="text-sm text-clay hover:text-ink" href="/">
          &lt;- 返回工作台
        </Link>

        <header className="mt-8 border-b border-ink/15 pb-6">
          <p className="text-sm uppercase tracking-[0.22em] text-moss">
            Question Detail
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none">
            {question.question_version?.stem ?? "题干版本缺失"}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge label={question.status} />
            <StatusBadge
              label={
                dimensionLabels[question.cognitive_dimension] ??
                question.cognitive_dimension
              }
            />
            <StatusBadge label={`难度 ${question.difficulty_level}`} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
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
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Panel title="标准答案" eyebrow="Answer">
            <p className="whitespace-pre-wrap text-base leading-7 text-ink/75">
              {question.answer_version?.answer_text ?? "标准答案版本缺失"}
            </p>
            {activeAnswerVersion?.explanation_text ? (
              <p className="mt-5 whitespace-pre-wrap border-t border-ink/10 pt-5 text-sm leading-7 text-ink/65">
                {activeAnswerVersion.explanation_text}
              </p>
            ) : null}
          </Panel>

          <Panel title="核心讲解" eyebrow="Core Explanation">
            {coreExplanation ? (
              <div className="space-y-5">
                <article className="border border-ink/10 bg-white/45 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-xl font-semibold">
                      {coreExplanation.version.title}
                    </h3>
                    <StatusBadge label={coreExplanation.version.status} />
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink/70">
                    {coreExplanation.version.explanation_text}
                  </p>
                </article>

                <form action={updateCoreExplanationAction} className="space-y-3">
                  <input
                    name="core_explanation_id"
                    type="hidden"
                    value={coreExplanation.id}
                  />
                  <input name="question_id" type="hidden" value={question.id} />
                  <label className="grid gap-2 text-sm">
                    <span className="text-ink/60">讲解标题</span>
                    <input
                      aria-label="编辑核心讲解标题"
                      className="w-full border border-ink/15 bg-white/60 p-3 text-sm outline-none focus:border-clay"
                      defaultValue={coreExplanation.version.title}
                      name="core_title"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="text-ink/60">讲解正文</span>
                    <textarea
                      aria-label="编辑核心讲解正文"
                      className="min-h-40 w-full border border-ink/15 bg-white/60 p-3 text-sm leading-6 outline-none focus:border-clay"
                      defaultValue={coreExplanation.version.explanation_text}
                      name="core_explanation_text"
                      required
                    />
                  </label>
                  <button className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                    保存核心讲解
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-sm leading-7 text-ink/65">
                当前知识点暂无核心讲解。围绕知识点生成题目后会自动创建核心讲解。
              </p>
            )}
          </Panel>

          <Panel title="编辑题目内容" eyebrow="Manual Edit">
            <form action={updateQuestionContentAction} className="space-y-3">
              <input name="question_id" type="hidden" value={question.id} />
              <label className="grid gap-2 text-sm">
                <span className="text-ink/60">题干</span>
                <textarea
                  aria-label="编辑题干"
                  className="min-h-28 w-full border border-ink/15 bg-white/60 p-3 text-sm leading-6 outline-none focus:border-clay"
                  defaultValue={question.question_version?.stem ?? ""}
                  name="stem"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-ink/60">标准答案</span>
                <textarea
                  aria-label="编辑标准答案"
                  className="min-h-32 w-full border border-ink/15 bg-white/60 p-3 text-sm leading-6 outline-none focus:border-clay"
                  defaultValue={question.answer_version?.answer_text ?? ""}
                  name="answer_text"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-ink/60">答案讲解</span>
                <textarea
                  aria-label="编辑答案讲解"
                  className="min-h-24 w-full border border-ink/15 bg-white/60 p-3 text-sm leading-6 outline-none focus:border-clay"
                  defaultValue={activeAnswerVersion?.explanation_text ?? ""}
                  name="explanation_text"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-ink/60">评分规则 JSON</span>
                <textarea
                  aria-label="编辑评分规则"
                  className="min-h-44 w-full border border-ink/15 bg-white/60 p-3 font-mono text-xs leading-5 outline-none focus:border-clay"
                  defaultValue={rubricJson}
                  name="rubric_json"
                  required
                />
              </label>
              <button className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                保存新版本
              </button>
            </form>
          </Panel>

          <Panel title="质量校验" eyebrow="Quality Check">
            <KeyValue label="状态" value={question.quality_check?.status ?? "未校验"} />
            <pre className="mt-4 max-h-72 overflow-auto border border-ink/10 bg-white/45 p-3 text-xs leading-5 text-ink/70">
              {JSON.stringify(
                {
                  rule_result: question.quality_check?.rule_result ?? null,
                  ai_result: question.quality_check?.ai_result ?? null
                },
                null,
                2
              )}
            </pre>
          </Panel>

          <Panel title="评分规则" eyebrow="Rubric">
            <pre className="max-h-80 overflow-auto border border-ink/10 bg-white/45 p-3 text-xs leading-5 text-ink/70">
              {JSON.stringify(question.scoring_rubric_version?.rubric ?? {}, null, 2)}
            </pre>
          </Panel>

          <Panel title="答题" eyebrow="Practice">
            {question.status === "confirmed" ? (
              <form action={submitAnswerAction} className="space-y-3">
                <input name="question_id" type="hidden" value={question.id} />
                <textarea
                  className="min-h-36 w-full border border-ink/15 bg-white/60 p-3 text-sm leading-6 outline-none focus:border-clay"
                  name="user_answer"
                  placeholder="输入你的答案，提交后系统会进行 mock AI 评分。"
                  required
                />
                <button className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                  提交答案
                </button>
              </form>
            ) : (
              <p className="text-sm leading-7 text-ink/65">
                当前题目尚未确认入库。请先确认入库，再提交正式答题记录。
              </p>
            )}
          </Panel>

          <Panel title="最近评分" eyebrow="Attempts">
            {attempts.items.length === 0 ? (
              <p className="text-sm leading-7 text-ink/65">
                暂无答题记录。提交答案后，这里会显示 AI 评分和反馈。
              </p>
            ) : (
              <div className="space-y-4">
                {attempts.items.map((attempt) => (
                  <article className="border border-ink/10 bg-white/45 p-3" key={attempt.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <strong className="text-2xl">{attempt.final_score}</strong>
                      <StatusBadge label={attempt.status} />
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink/70">
                      {attempt.ai_feedback}
                    </p>
                    <p className="mt-3 text-xs text-ink/55">
                      {formatDate(attempt.created_at)} · {attempt.reason_tags.join(" / ")}
                    </p>
                    <form action={confirmScoreAction} className="mt-4 grid gap-2">
                      <input name="attempt_id" type="hidden" value={attempt.id} />
                      <input name="question_id" type="hidden" value={question.id} />
                      <label className="text-xs text-ink/55" htmlFor={`score-${attempt.id}`}>
                        用户确认分数
                      </label>
                      <input
                        className="w-full border border-ink/15 bg-white/60 p-2 text-sm outline-none focus:border-clay"
                        defaultValue={attempt.final_score}
                        id={`score-${attempt.id}`}
                        max={100}
                        min={0}
                        name="user_confirmed_score"
                        required
                        type="number"
                      />
                      <input
                        className="w-full border border-ink/15 bg-white/60 p-2 text-sm outline-none focus:border-clay"
                        name="score_diff_reason"
                        placeholder="修正原因，可选"
                      />
                      <button className="w-fit border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                        确认评分
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="版本审计" eyebrow="Versions">
            <div className="space-y-4 text-sm leading-6 text-ink/70">
              <VersionLine
                label="题目版本"
                model={question.question_versions[0]?.model_name}
                agent={question.question_versions[0]?.ai_agent}
                status={question.question_versions[0]?.status}
              />
              <VersionLine
                label="答案版本"
                model={question.answer_versions[0]?.model_name}
                agent={question.answer_versions[0]?.ai_agent}
                status={question.answer_versions[0]?.status}
              />
              <VersionLine
                label="评分规则"
                model={question.scoring_rubric_versions[0]?.model_name}
                agent={question.scoring_rubric_versions[0]?.ai_agent}
                status={question.scoring_rubric_versions[0]?.status}
              />
              <KeyValue label="创建时间" value={formatDate(question.created_at)} />
              <KeyValue label="更新时间" value={formatDate(question.updated_at)} />
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}

async function confirmQuestionAction(formData: FormData) {
  "use server";

  const questionId = getRequiredFormValue(formData, "question_id");
  await confirmQuestion(questionId);
  revalidatePath("/");
  revalidatePath(`/questions/${questionId}`);
}

async function archiveQuestionAction(formData: FormData) {
  "use server";

  const questionId = getRequiredFormValue(formData, "question_id");
  await archiveQuestion(questionId);
  revalidatePath("/");
  revalidatePath(`/questions/${questionId}`);
}

async function updateQuestionContentAction(formData: FormData) {
  "use server";

  const questionId = getRequiredFormValue(formData, "question_id");
  await updateQuestionContent(questionId, {
    stem: getRequiredFormValue(formData, "stem"),
    answer_text: getRequiredFormValue(formData, "answer_text"),
    explanation_text: getOptionalFormValue(formData, "explanation_text"),
    rubric: parseRubricJson(getRequiredFormValue(formData, "rubric_json"))
  });
  revalidatePath("/");
  revalidatePath("/questions");
  revalidatePath(`/questions/${questionId}`);
}

async function updateCoreExplanationAction(formData: FormData) {
  "use server";

  const questionId = getRequiredFormValue(formData, "question_id");
  await updateCoreExplanationContent(
    getRequiredFormValue(formData, "core_explanation_id"),
    {
      title: getRequiredFormValue(formData, "core_title"),
      explanation_text: getRequiredFormValue(formData, "core_explanation_text")
    }
  );
  revalidatePath("/");
  revalidatePath("/questions");
  revalidatePath(`/questions/${questionId}`);
}

async function submitAnswerAction(formData: FormData) {
  "use server";

  const questionId = getRequiredFormValue(formData, "question_id");
  const userAnswer = getRequiredFormValue(formData, "user_answer");
  await submitAnswerAttempt(questionId, {
    user_answer: userAnswer,
    affects_mastery: true
  });
  revalidatePath("/");
  revalidatePath(`/questions/${questionId}`);
}

async function confirmScoreAction(formData: FormData) {
  "use server";

  const attemptId = getRequiredFormValue(formData, "attempt_id");
  const questionId = getRequiredFormValue(formData, "question_id");
  const rawScore = getRequiredFormValue(formData, "user_confirmed_score");
  const score = Number(rawScore);

  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error("user_confirmed_score_invalid");
  }

  await confirmScore(attemptId, {
    user_confirmed_score: score,
    score_diff_reason: getOptionalFormValue(formData, "score_diff_reason")
  });
  revalidatePath("/");
  revalidatePath(`/questions/${questionId}`);
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

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="whitespace-nowrap bg-brass px-2 py-1 text-xs text-white">
      {label}
    </span>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink/10 py-2">
      <span className="text-ink/55">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function VersionLine({
  agent,
  label,
  model,
  status
}: {
  agent?: string | null;
  label: string;
  model?: string | null;
  status?: string | null;
}) {
  return (
    <div className="border-b border-ink/10 py-2">
      <div className="flex justify-between gap-4">
        <span className="text-ink/55">{label}</span>
        <span>{status ?? "未知"}</span>
      </div>
      <p className="mt-1 text-xs text-ink/55">
        {agent ?? "unknown agent"} · {model ?? "unknown model"}
      </p>
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

function getOptionalFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  return value;
}

function parseRubricJson(value: string) {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("rubric_json_object_required");
  }

  return parsed as Record<string, unknown>;
}

import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  confirmReviewItem,
  getReviewItem,
  rejectReviewItem,
  updateReviewItemPreview
} from "@/lib/ingestion/service";

export const dynamic = "force-dynamic";

const dimensionLabels: Record<string, string> = {
  understand: "理解",
  distinguish: "区分",
  apply: "应用",
  analyze: "分析",
  evaluate: "评价"
};

export default async function ReviewItemPage({
  params
}: {
  params: Promise<{ reviewItemId: string }>;
}) {
  const { reviewItemId } = await params;
  const item = await getReviewItem(reviewItemId);

  if (!item) {
    notFound();
  }

  const preview = item.preview as Record<string, unknown>;
  const topic = getTopicSuggestion(preview);
  const knowledgePoints = getKnowledgePoints(preview);
  const questions = getQuestions(preview);

  return (
    <main className="min-h-screen bg-paper px-5 py-7 text-ink lg:px-6">
      <section className="mx-auto w-full max-w-5xl space-y-7">
        <Link className="text-sm text-clay hover:text-ink" href="/">
          返回工作台
        </Link>

        <header className="border-b border-ink/15 pb-6">
          <p className="text-sm uppercase tracking-[0.22em] text-clay">
            Review Item
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none">
            待确认内容编辑
          </h1>
          <p className="mt-4 text-sm leading-6 text-ink/65">
            {item.status} · {formatDate(item.created_at)}
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <form
            action={updateReviewPreviewAction}
            className="space-y-5 border border-ink/20 bg-white/35 p-5 shadow-line"
          >
            <input name="review_item_id" type="hidden" value={item.review_item_id} />
            <div>
              <label className="text-sm font-semibold" htmlFor="domain-name">
                建议领域
              </label>
              <input
                aria-label="建议领域"
                className="mt-2 w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                defaultValue={topic.domain_name}
                id="domain-name"
                name="domain_name"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold" htmlFor="topic-name">
                建议主题
              </label>
              <input
                aria-label="建议主题"
                className="mt-2 w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                defaultValue={topic.topic_name}
                id="topic-name"
                name="topic_name"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold" htmlFor="knowledge-points">
                知识点预览
              </label>
              <textarea
                aria-label="知识点预览"
                className="mt-2 min-h-36 w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm leading-6 outline-none focus:border-clay"
                defaultValue={knowledgePoints.join("\n")}
                id="knowledge-points"
                name="knowledge_points_text"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold" htmlFor="questions-json">
                题目预览 JSON
              </label>
              <textarea
                aria-label="题目预览 JSON"
                className="mt-2 min-h-64 w-full border border-ink/20 bg-white/75 px-3 py-2 font-mono text-xs leading-6 outline-none focus:border-clay"
                defaultValue={JSON.stringify(questions, null, 2)}
                id="questions-json"
                name="questions_preview_json"
                required
              />
            </div>

            <button className="border border-clay bg-clay px-4 py-2 text-sm text-paper transition hover:bg-ink">
              保存预览
            </button>
          </form>

          <aside className="space-y-5">
            <section className="border border-ink/20 bg-white/35 p-5 shadow-line">
              <p className="text-xs uppercase tracking-[0.2em] text-moss">
                Current Preview
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{topic.topic_name}</h2>
              <p className="mt-2 text-sm text-ink/65">{topic.domain_name}</p>

              <div className="mt-5 space-y-2">
                {knowledgePoints.map((point) => (
                  <p className="border-b border-ink/10 pb-2 text-sm" key={point}>
                    {point}
                  </p>
                ))}
              </div>
            </section>

            <section className="border border-ink/20 bg-white/35 p-5 shadow-line">
              <p className="text-xs uppercase tracking-[0.2em] text-moss">
                Questions
              </p>
              <div className="mt-4 space-y-4">
                {questions.map((question, index) => (
                  <article className="border border-ink/15 bg-white/45 p-4" key={index}>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-ink/10 px-2 py-1">
                        {dimensionLabels[question.cognitive_dimension] ??
                          question.cognitive_dimension}
                      </span>
                      <span className="bg-ink/10 px-2 py-1">
                        难度 {question.difficulty_level}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6">{question.stem}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="flex flex-wrap gap-2 border border-ink/20 bg-white/35 p-5 shadow-line">
              <form action={confirmReviewItemAction}>
                <input
                  name="review_item_id"
                  type="hidden"
                  value={item.review_item_id}
                />
                <button className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                  确认入库
                </button>
              </form>
              <form action={rejectReviewItemAction}>
                <input
                  name="review_item_id"
                  type="hidden"
                  value={item.review_item_id}
                />
                <button className="border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay">
                  拒绝
                </button>
              </form>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}

async function updateReviewPreviewAction(formData: FormData) {
  "use server";

  const reviewItemId = getRequiredFormValue(formData, "review_item_id");
  const questionsPreview = parseQuestionsPreview(
    getRequiredFormValue(formData, "questions_preview_json")
  );

  await updateReviewItemPreview(reviewItemId, {
    domain_name: getRequiredFormValue(formData, "domain_name"),
    topic_name: getRequiredFormValue(formData, "topic_name"),
    knowledge_points_preview: getRequiredFormValue(
      formData,
      "knowledge_points_text"
    )
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean),
    questions_preview: questionsPreview
  });

  revalidatePath("/");
  revalidatePath(`/review/${reviewItemId}`);
}

async function confirmReviewItemAction(formData: FormData) {
  "use server";

  const reviewItemId = getRequiredFormValue(formData, "review_item_id");
  await confirmReviewItem(reviewItemId, {
    include_existing_attempts_in_mastery: false
  });
  revalidatePath("/");
  revalidatePath(`/review/${reviewItemId}`);
}

async function rejectReviewItemAction(formData: FormData) {
  "use server";

  const reviewItemId = getRequiredFormValue(formData, "review_item_id");
  await rejectReviewItem(reviewItemId);
  revalidatePath("/");
  revalidatePath(`/review/${reviewItemId}`);
}

function getTopicSuggestion(preview: Record<string, unknown>) {
  const topicSuggestion = preview.topic_suggestion;
  if (topicSuggestion && typeof topicSuggestion === "object") {
    const topic = topicSuggestion as Record<string, unknown>;
    return {
      domain_name: asString(topic.domain_name, "计算机"),
      topic_name: asString(topic.topic_name, "待确认主题")
    };
  }

  return {
    domain_name: "计算机",
    topic_name: asString(preview.suggested_topic, "待确认主题")
  };
}

function getKnowledgePoints(preview: Record<string, unknown>) {
  if (!Array.isArray(preview.knowledge_points_preview)) {
    return ["待确认知识点"];
  }

  return preview.knowledge_points_preview
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);
}

function getQuestions(preview: Record<string, unknown>) {
  if (!Array.isArray(preview.questions_preview)) {
    return [];
  }

  return preview.questions_preview
    .map((value) => {
      if (!value || typeof value !== "object") {
        return null;
      }

      const question = value as Record<string, unknown>;
      return {
        stem: asString(question.stem, "待补充题干"),
        cognitive_dimension: asString(question.cognitive_dimension, "understand"),
        difficulty_level: Number(question.difficulty_level ?? 2)
      };
    })
    .filter((value): value is ReviewQuestionPreview => value !== null);
}

function parseQuestionsPreview(value: string) {
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("questions_preview_json_must_be_array");
  }

  return parsed.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("invalid_question_preview");
    }

    const question = item as Record<string, unknown>;
    return {
      stem: asString(question.stem, ""),
      cognitive_dimension: asString(question.cognitive_dimension, "understand") as
        | "understand"
        | "distinguish"
        | "apply"
        | "analyze"
        | "evaluate",
      difficulty_level: Number(question.difficulty_level ?? 2)
    };
  });
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
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

type ReviewQuestionPreview = {
  stem: string;
  cognitive_dimension: string;
  difficulty_level: number;
};

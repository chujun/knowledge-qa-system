import { revalidatePath } from "next/cache";
import Link from "next/link";

import {
  confirmReviewItem,
  listReviewItems,
  rejectReviewItem
} from "@/lib/ingestion/service";
import {
  createDomain,
  createKnowledgePoint,
  createTopic,
  listDomains,
  listKnowledgePoints,
  listKnowledgeTypes,
  listTopics
} from "@/lib/knowledge/service";
import { listErrorSets, listMasteryProfiles } from "@/lib/practice/service";
import {
  generateForKnowledgePoint,
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

export default async function Home() {
  const data = await loadWorkbenchData();
  const firstQuestion = data.questions.items[0];
  const firstProfile = data.mastery.items[0];
  const firstPoint = data.knowledgePoints.items[0];
  const dimensionScores = firstProfile?.dimension_scores ?? {};

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-8 px-5 py-7 lg:grid-cols-[300px_1fr] lg:px-6">
        <aside className="border-ink/15 lg:border-r lg:pr-8">
          <div className="sticky top-7 space-y-8">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-moss">Learn QA</p>
              <h1 className="mt-4 font-display text-5xl leading-none text-ink">
                知识问答工作台
              </h1>
            </div>

            <nav className="space-y-1 text-sm">
              {[
                ["待确认", data.reviewItems.total],
                ["领域", data.domains.total],
                ["主题", data.topics.total],
                ["知识点", data.knowledgePoints.total],
                ["题库", data.questions.total],
                ["画像", data.mastery.total],
                ["错误集", data.errorSets.total]
              ].map(([item, total]) => (
                <a
                  className="flex items-center justify-between border-b border-ink/15 py-3 text-ink transition hover:text-clay"
                  href={`#${item}`}
                  key={item}
                >
                  <span>{item}</span>
                  <span className="font-mono text-xs text-ink/55">{total}</span>
                </a>
              ))}
            </nav>

            <div className="border border-ink/20 bg-white/40 p-5 shadow-line">
              <p className="text-xs uppercase tracking-[0.22em] text-moss">Local Runtime</p>
              <p className="mt-3 text-2xl font-semibold">Codex + mock AI</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Web 本地单用户；API/Agent 调用使用 API Key；MCP stdio 已预留。
              </p>
            </div>
          </div>
        </aside>

        <div className="space-y-8">
          <section className="grid gap-4 border-b border-ink/15 pb-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-clay">MVP Core Loop</p>
              <h2 className="mt-4 max-w-3xl font-display text-5xl leading-[0.98] lg:text-6xl">
                从 AI 会话里提炼知识，再用问答检验掌握。
              </h2>
            </div>
            <div className="flex flex-col justify-end text-base leading-7 text-ink/72">
              <p>
                当前页面已经读取真实本地数据：待确认队列、知识点、正式题库、掌握画像和错误集。
                数据为空时会显示下一步入口，而不是演示假数据。
              </p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-7" aria-label="系统统计">
            <Metric label="待确认" value={data.reviewItems.total} />
            <Metric label="领域" value={data.domains.total} />
            <Metric label="主题" value={data.topics.total} />
            <Metric label="知识点" value={data.knowledgePoints.total} />
            <Metric label="题目" value={data.questions.total} />
            <Metric label="画像" value={data.mastery.total} />
            <Metric label="错误集" value={data.errorSets.total} />
          </section>

          <section className="grid gap-4 md:grid-cols-3" aria-label="功能入口">
            <WorkbenchLink
              description="按领域、主题、知识点查看结构，并从任意知识点生成题目。"
              href="/domains"
              label="知识结构管理"
            />
            <WorkbenchLink
              description="集中查看题目状态、认知维度、难度和题目详情。"
              href="/questions"
              label="题库管理"
            />
            <WorkbenchLink
              description="基于正式题库、薄弱维度和错误集创建针对性练习。"
              href="/practice"
              label="针对性练习"
            />
          </section>

          <section id="领域">
            <Panel
              eyebrow="Knowledge Setup"
              title="创建知识结构"
              empty={false}
              emptyText=""
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <form action={createDomainAction} className="space-y-3 border border-ink/15 bg-white/45 p-4">
                  <h3 className="text-lg font-semibold">知识领域</h3>
                  <input
                    aria-label="领域名称"
                    className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                    name="domain_name"
                    placeholder="例如：计算机、摄影、历史"
                    required
                  />
                  <textarea
                    aria-label="领域说明"
                    className="min-h-24 w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                    name="domain_description"
                    placeholder="领域说明，可选"
                  />
                  <button className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                    创建领域
                  </button>
                </form>

                <form action={createTopicAction} className="space-y-3 border border-ink/15 bg-white/45 p-4">
                  <h3 className="text-lg font-semibold">知识主题</h3>
                  <select
                    aria-label="主题所属领域"
                    className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                    name="domain_id"
                    required
                  >
                    <option value="">选择领域</option>
                    {data.domains.items.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="主题名称"
                    className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                    name="topic_name"
                    placeholder="例如：GitHub Actions"
                    required
                  />
                  <textarea
                    aria-label="主题说明"
                    className="min-h-24 w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                    name="topic_description"
                    placeholder="主题说明，可选"
                  />
                  <button className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                    创建主题
                  </button>
                </form>

                <form action={createKnowledgePointAction} className="space-y-3 border border-ink/15 bg-white/45 p-4">
                  <h3 className="text-lg font-semibold">知识点</h3>
                  <select
                    aria-label="知识点所属领域"
                    className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                    name="domain_id"
                    required
                  >
                    <option value="">选择领域</option>
                    {data.domains.items.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="知识点所属主题"
                    className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                    name="topic_id"
                    required
                  >
                    <option value="">选择主题</option>
                    {data.topics.items.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="知识点类型"
                    className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                    name="knowledge_type_id"
                    required
                  >
                    {data.knowledgeTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="知识点名称"
                    className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                    name="point_name"
                    placeholder="例如：workflow 触发条件"
                    required
                  />
                  <textarea
                    aria-label="知识点说明"
                    className="min-h-24 w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                    name="point_description"
                    placeholder="知识点说明，可选"
                  />
                  <button className="border border-clay bg-clay px-3 py-2 text-sm text-paper transition hover:bg-ink">
                    创建知识点
                  </button>
                </form>
              </div>
            </Panel>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]" id="待确认">
            <Panel
              eyebrow="Review Queue"
              title="待确认入库"
              empty={data.reviewItems.items.length === 0}
              emptyText="暂无待确认内容。可以先通过 Agent CLI 或 MCP stdio 提交一次外部会话沉淀。"
            >
              <div className="space-y-3">
                {data.reviewItems.items.map((item) => (
                  <article className="border border-ink/15 bg-white/45 p-4" key={item.review_item_id}>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold leading-snug">
                        {getReviewTitle(item.preview)}
                      </h3>
                      <StatusBadge label={item.status} />
                    </div>
                    <p className="mt-3 text-sm text-ink/65">
                      {item.target_type} · {formatDate(item.created_at)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        className="border border-clay bg-white/60 px-3 py-2 text-sm text-clay transition hover:bg-clay hover:text-paper"
                        href={`/review/${item.review_item_id}`}
                      >
                        编辑详情
                      </Link>
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
                    </div>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel
              eyebrow="Knowledge Structure"
              title="知识点"
              empty={data.knowledgePoints.items.length === 0}
              emptyText="暂无知识点。先创建知识领域、主题和知识点后，题目生成与练习会更完整。"
              id="知识点"
            >
              <div className="space-y-3">
                {data.knowledgePoints.items.map((point) => (
                  <article className="border border-ink/15 bg-white/45 p-4" key={point.id}>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold leading-snug">{point.name}</h3>
                      <StatusBadge label={point.status} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink/65">
                      {point.description || "尚未补充摘要"}
                    </p>
                    <form action={generateQuestionsAction} className="mt-4">
                      <input name="knowledge_point_id" type="hidden" value={point.id} />
                      <button className="border border-clay bg-clay px-3 py-2 text-sm text-paper transition hover:bg-ink">
                        生成题目
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            </Panel>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]" id="画像">
            <Panel
              eyebrow="Mastery Profile"
              title={firstPoint?.name ?? "掌握画像"}
              empty={!firstProfile}
              emptyText="暂无长期掌握画像。完成一次正式题答题并确认评分后，这里会显示五维掌握情况。"
            >
              <div className="space-y-4">
                {Object.entries(dimensionLabels).map(([dimension, label]) => {
                  const value = Number(dimensionScores[dimension] ?? 0);
                  return (
                    <div key={dimension}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                      <div className="h-2 bg-ink/10">
                        <div className="h-full bg-moss" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel
              eyebrow="Question Bank"
              title="最近生成题目"
              empty={!firstQuestion}
              emptyText="暂无题目。先围绕某个知识点生成题目，再确认入库。"
              id="题库"
            >
              {firstQuestion ? (
                <article>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={firstQuestion.status} />
                    <span className="bg-ink/10 px-2 py-1 text-xs">
                      {dimensionLabels[firstQuestion.cognitive_dimension] ??
                        firstQuestion.cognitive_dimension}
                    </span>
                    <span className="bg-ink/10 px-2 py-1 text-xs">
                      难度 {firstQuestion.difficulty_level}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold leading-snug">
                    {firstQuestion.question_version?.stem ?? "题干版本缺失"}
                  </h3>
                  <p className="mt-5 text-sm leading-7 text-ink/70">
                    题目已进入题库流程。待确认题需要确认入库后，才会进入正式练习和长期掌握画像。
                  </p>
                  <Link
                    className="mt-5 inline-block border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay"
                    href={`/questions/${firstQuestion.id}`}
                  >
                    查看详情
                  </Link>
                </article>
              ) : null}
            </Panel>
          </section>

          <section id="错误集">
            <Panel
              eyebrow="Error Sets"
              title="错误集复盘"
              empty={data.errorSets.items.length === 0}
              emptyText="暂无活跃错误集。系统会在低分答题后按知识点和错误标签自动归集。"
            >
              <div className="grid gap-3 md:grid-cols-2">
                {data.errorSets.items.map((item) => (
                  <article className="border border-ink/15 bg-white/45 p-4" key={item.id}>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold">知识点错误集</h3>
                      <StatusBadge label={item.status} />
                    </div>
                    <p className="mt-3 text-sm text-ink/65">
                      {item.dominant_tags.length > 0
                        ? item.dominant_tags.join(" / ")
                        : "暂无主导错误标签"}
                    </p>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        </div>
      </section>
    </main>
  );
}

async function loadWorkbenchData() {
  const [
    reviewItems,
    domains,
    topics,
    knowledgeTypes,
    knowledgePoints,
    questions,
    mastery,
    errorSets
  ] = await Promise.all([
    listReviewItems({ status: "pending", pageSize: 5 }),
    listDomains({ pageSize: 20 }),
    listTopics({ pageSize: 20 }),
    listKnowledgeTypes(),
    listKnowledgePoints({ status: "confirmed", pageSize: 5 }),
    listQuestions({ pageSize: 5 }),
    listMasteryProfiles({ pageSize: 5 }),
    listErrorSets({ status: "active", pageSize: 5 })
  ]);

  return {
    reviewItems,
    domains,
    topics,
    knowledgeTypes,
    knowledgePoints,
    questions,
    mastery,
    errorSets
  };
}

async function createDomainAction(formData: FormData) {
  "use server";

  await createDomain({
    name: getRequiredFormValue(formData, "domain_name"),
    description: getOptionalFormValue(formData, "domain_description")
  });
  revalidatePath("/");
}

async function createTopicAction(formData: FormData) {
  "use server";

  await createTopic({
    domain_id: getRequiredFormValue(formData, "domain_id"),
    name: getRequiredFormValue(formData, "topic_name"),
    description: getOptionalFormValue(formData, "topic_description")
  });
  revalidatePath("/");
}

async function createKnowledgePointAction(formData: FormData) {
  "use server";

  await createKnowledgePoint({
    domain_id: getRequiredFormValue(formData, "domain_id"),
    topic_id: getRequiredFormValue(formData, "topic_id"),
    knowledge_type_id: getRequiredFormValue(formData, "knowledge_type_id"),
    name: getRequiredFormValue(formData, "point_name"),
    description: getOptionalFormValue(formData, "point_description"),
    complexity_level: "medium",
    suggested_difficulty: 3
  });
  revalidatePath("/");
}

async function confirmReviewItemAction(formData: FormData) {
  "use server";

  const reviewItemId = getRequiredFormValue(formData, "review_item_id");
  await confirmReviewItem(reviewItemId, {
    include_existing_attempts_in_mastery: false
  });
  revalidatePath("/");
}

async function rejectReviewItemAction(formData: FormData) {
  "use server";

  const reviewItemId = getRequiredFormValue(formData, "review_item_id");
  await rejectReviewItem(reviewItemId);
  revalidatePath("/");
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
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-ink/15 bg-white/35 p-4 shadow-line">
      <p className="text-xs uppercase tracking-[0.18em] text-ink/55">{label}</p>
      <p className="mt-3 font-display text-4xl leading-none">{value}</p>
    </div>
  );
}

function WorkbenchLink({
  description,
  href,
  label
}: {
  description: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      className="group border border-ink/15 bg-white/35 p-4 shadow-line transition hover:border-clay hover:bg-white/60"
      href={href}
    >
      <span className="text-xs uppercase tracking-[0.18em] text-clay">Open</span>
      <span className="mt-3 block text-2xl font-semibold group-hover:text-clay">
        {label}
      </span>
      <span className="mt-3 block text-sm leading-6 text-ink/65">{description}</span>
    </Link>
  );
}

function Panel({
  children,
  empty,
  emptyText,
  eyebrow,
  id,
  title
}: {
  children: React.ReactNode;
  empty: boolean;
  emptyText: string;
  eyebrow: string;
  id?: string;
  title: string;
}) {
  return (
    <section className="border border-ink/20 bg-white/30 p-5 shadow-line" id={id}>
      <p className="text-xs uppercase tracking-[0.2em] text-clay">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl leading-none">{title}</h2>
      <div className="mt-6">
        {empty ? <p className="text-sm leading-7 text-ink/65">{emptyText}</p> : children}
      </div>
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

function getReviewTitle(preview: unknown) {
  if (!preview || typeof preview !== "object") {
    return "待确认内容";
  }

  const record = preview as Record<string, unknown>;
  const topicSuggestion = record.topic_suggestion;
  if (topicSuggestion && typeof topicSuggestion === "object") {
    const topic = topicSuggestion as Record<string, unknown>;
    if (typeof topic.topic_name === "string") {
      return topic.topic_name;
    }
  }

  if (typeof record.suggested_topic === "string") {
    return record.suggested_topic;
  }

  if (Array.isArray(record.knowledge_points_preview)) {
    return record.knowledge_points_preview.filter(Boolean).join(" / ") || "待确认知识点";
  }

  return "待确认内容";
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

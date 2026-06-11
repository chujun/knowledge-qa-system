import { revalidatePath } from "next/cache";
import {
  archiveDomain,
  archiveKnowledgePoint,
  listDomains,
  listKnowledgePoints,
  listTopics,
  updateDomain,
  updateKnowledgePoint,
  updateTopic
} from "@/lib/knowledge/service";
import {
  GenerateQuestionsForm,
  type GenerateQuestionsState
} from "@/components/generate-questions-form";
import { generateForKnowledgePoint } from "@/lib/questions/service";
import { TopNav } from "@/components/top-nav";

export const dynamic = "force-dynamic";

export default async function DomainsPage({
  searchParams
}: {
  searchParams: Promise<{
    generation_status?: string;
  }>;
}) {
  const currentSearchParams = await searchParams;
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

        {currentSearchParams.generation_status === "failed" ? (
          <StatusNotice
            text="后台模型调用没有成功，请稍后重试，或到调用记录查看失败记录。"
            title="生成题目失败"
          />
        ) : null}

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
                  <details className="mt-5 border border-ink/10 bg-white/35 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-ink">
                      编辑领域
                    </summary>
                    <form action={updateDomainAction} className="mt-4 grid gap-3">
                      <input name="domain_id" type="hidden" value={domain.id} />
                      <input
                        aria-label={`${domain.name} 领域名称`}
                        className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                        defaultValue={domain.name}
                        name="domain_name"
                        required
                      />
                      <textarea
                        aria-label={`${domain.name} 领域说明`}
                        className="min-h-20 w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                        defaultValue={domain.description ?? ""}
                        name="domain_description"
                        placeholder="领域说明，可选"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                          保存领域
                        </button>
                      </div>
                    </form>
                    {domain.status !== "archived" ? (
                      <form action={archiveDomainAction} className="mt-2">
                        <input name="domain_id" type="hidden" value={domain.id} />
                        <button className="border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay">
                          归档领域
                        </button>
                      </form>
                    ) : null}
                  </details>

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
                            <details className="mt-4 border border-ink/10 bg-white/40 p-3">
                              <summary className="cursor-pointer text-sm font-semibold">
                                编辑主题
                              </summary>
                              <form action={updateTopicAction} className="mt-3 grid gap-3">
                                <input name="topic_id" type="hidden" value={topic.id} />
                                <input
                                  aria-label={`${topic.name} 主题名称`}
                                  className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                                  defaultValue={topic.name}
                                  name="topic_name"
                                  required
                                />
                                <textarea
                                  aria-label={`${topic.name} 主题说明`}
                                  className="min-h-20 w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                                  defaultValue={topic.description ?? ""}
                                  name="topic_description"
                                  placeholder="主题说明，可选"
                                />
                                <div className="flex flex-wrap gap-2">
                                  <button className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                                    保存主题
                                  </button>
                                </div>
                              </form>
                              {topic.status !== "archived" ? (
                                <form action={archiveTopicAction} className="mt-2">
                                  <input name="topic_id" type="hidden" value={topic.id} />
                                  <button className="border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay">
                                    归档主题
                                  </button>
                                </form>
                              ) : null}
                            </details>

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
                                    <details className="mt-4 border border-ink/10 bg-white/40 p-3">
                                      <summary className="cursor-pointer text-sm font-semibold">
                                        编辑知识点
                                      </summary>
                                      <form action={updateKnowledgePointAction} className="mt-3 grid gap-3">
                                        <input
                                          name="knowledge_point_id"
                                          type="hidden"
                                          value={point.id}
                                        />
                                        <input
                                          aria-label={`${point.name} 知识点名称`}
                                          className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                                          defaultValue={point.name}
                                          name="point_name"
                                          required
                                        />
                                        <textarea
                                          aria-label={`${point.name} 知识点说明`}
                                          className="min-h-20 w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                                          defaultValue={point.description ?? ""}
                                          name="point_description"
                                          placeholder="知识点说明，可选"
                                        />
                                        <div className="grid gap-3 sm:grid-cols-2">
                                          <select
                                            aria-label={`${point.name} 复杂度`}
                                            className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                                            defaultValue={point.complexity_level}
                                            name="complexity_level"
                                          >
                                            <option value="simple">simple</option>
                                            <option value="medium">medium</option>
                                            <option value="complex">complex</option>
                                          </select>
                                          <input
                                            aria-label={`${point.name} 建议难度`}
                                            className="w-full border border-ink/20 bg-white/75 px-3 py-2 text-sm outline-none focus:border-clay"
                                            defaultValue={point.suggested_difficulty}
                                            max={5}
                                            min={1}
                                            name="suggested_difficulty"
                                            type="number"
                                          />
                                        </div>
                                        <button className="w-fit border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                                          保存知识点
                                        </button>
                                      </form>
                                      {point.status !== "archived" ? (
                                        <form action={archiveKnowledgePointAction} className="mt-2">
                                          <input
                                            name="knowledge_point_id"
                                            type="hidden"
                                            value={point.id}
                                          />
                                          <button className="border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay">
                                            归档知识点
                                          </button>
                                        </form>
                                      ) : null}
                                    </details>
                                    <GenerateQuestionsForm
                                      action={generateQuestionsAction}
                                      buttonClassName="border border-clay bg-clay px-3 py-2 text-sm text-paper transition hover:bg-ink"
                                      className="mt-4"
                                      knowledgePointId={point.id}
                                    />
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

async function updateDomainAction(formData: FormData) {
  "use server";

  await updateDomain(getRequiredFormValue(formData, "domain_id"), {
    name: getRequiredFormValue(formData, "domain_name"),
    description: getOptionalFormValue(formData, "domain_description")
  });
  revalidateStructurePaths();
}

async function archiveDomainAction(formData: FormData) {
  "use server";

  await archiveDomain(getRequiredFormValue(formData, "domain_id"));
  revalidateStructurePaths();
}

async function updateTopicAction(formData: FormData) {
  "use server";

  await updateTopic(getRequiredFormValue(formData, "topic_id"), {
    name: getRequiredFormValue(formData, "topic_name"),
    description: getOptionalFormValue(formData, "topic_description")
  });
  revalidateStructurePaths();
}

async function archiveTopicAction(formData: FormData) {
  "use server";

  await updateTopic(getRequiredFormValue(formData, "topic_id"), {
    status: "archived"
  });
  revalidateStructurePaths();
}

async function updateKnowledgePointAction(formData: FormData) {
  "use server";

  const difficulty = Number(getRequiredFormValue(formData, "suggested_difficulty"));
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    throw new Error("suggested_difficulty_invalid");
  }

  const complexityLevel = getRequiredFormValue(formData, "complexity_level");
  if (!["simple", "medium", "complex"].includes(complexityLevel)) {
    throw new Error("complexity_level_invalid");
  }

  await updateKnowledgePoint(getRequiredFormValue(formData, "knowledge_point_id"), {
    name: getRequiredFormValue(formData, "point_name"),
    description: getOptionalFormValue(formData, "point_description"),
    complexity_level: complexityLevel as "simple" | "medium" | "complex",
    suggested_difficulty: difficulty
  });
  revalidateStructurePaths();
}

async function archiveKnowledgePointAction(formData: FormData) {
  "use server";

  await archiveKnowledgePoint(getRequiredFormValue(formData, "knowledge_point_id"));
  revalidateStructurePaths();
}

async function generateQuestionsAction(
  _state: GenerateQuestionsState,
  formData: FormData
): Promise<GenerateQuestionsState> {
  "use server";

  const knowledgePointId = getRequiredFormValue(formData, "knowledge_point_id");
  try {
    await generateForKnowledgePoint({
      knowledge_point_id: knowledgePointId,
      cognitive_dimensions: ["understand", "apply"],
      question_count: 2,
      direct_confirm: false
    });
    revalidatePath("/");
    revalidatePath("/domains");
    revalidatePath("/questions");
    return {
      status: "success",
      message: "生成完成，题目已进入待确认流程。"
    };
  } catch {
    revalidatePath("/domains");
    return {
      status: "failed",
      message: "生成题目失败：后台模型调用没有成功，请稍后重试或查看调用记录。"
    };
  }
}

function revalidateStructurePaths() {
  revalidatePath("/");
  revalidatePath("/domains");
  revalidatePath("/questions");
  revalidatePath("/practice");
}


function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-ink/15 bg-white/35 p-4 shadow-line">
      <p className="text-xs uppercase tracking-[0.18em] text-ink/55">{label}</p>
      <p className="mt-3 font-display text-4xl leading-none">{value}</p>
    </div>
  );
}

function StatusNotice({ text, title }: { text: string; title: string }) {
  return (
    <section
      className="mt-6 border border-red-800/30 bg-red-50 p-4 text-red-950 shadow-line"
      role="status"
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 opacity-75">{text}</p>
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

function getOptionalFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  return value;
}


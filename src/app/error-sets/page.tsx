import { revalidatePath } from "next/cache";
import Link from "next/link";

import { listErrorSets, resolveErrorSet } from "@/lib/practice/service";

export const dynamic = "force-dynamic";

export default async function ErrorSetsPage() {
  const [allErrorSets, activeErrorSets, resolvedErrorSets] = await Promise.all([
    listErrorSets({ pageSize: 50 }),
    listErrorSets({ status: "active", pageSize: 1 }),
    listErrorSets({ status: "resolved", pageSize: 1 })
  ]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-6xl px-5 py-7 lg:px-6">
        <TopNav current="错误集" />

        <header className="mt-8 border-b border-ink/15 pb-6">
          <p className="text-sm uppercase tracking-[0.22em] text-moss">
            Error Set Review
          </p>
          <h1 className="mt-4 font-display text-5xl leading-none">错误集管理</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink/65">
            按知识点查看低分或修正评分后归集的错误标签，完成复盘后可以将活跃错误集标记为已解决。
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <Metric label="全部错误集" value={allErrorSets.total} />
          <Metric label="活跃" value={activeErrorSets.total} />
          <Metric label="已解决" value={resolvedErrorSets.total} />
        </section>

        <section className="mt-8">
          {allErrorSets.items.length === 0 ? (
            <EmptyState text="暂无错误集。完成一次低分答题或用户修正评分后，系统会按知识点归集错误原因。" />
          ) : (
            <div className="space-y-3">
              {allErrorSets.items.map((errorSet) => (
                <article
                  className="border border-ink/20 bg-white/30 p-5 shadow-line"
                  key={errorSet.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge label={errorSet.status} />
                        <StatusBadge
                          label={`${errorSet.attempt_ids.length} 条证据`}
                        />
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold leading-snug">
                        {errorSet.knowledge_point?.name ?? "未知知识点"}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-ink/65">
                        {errorSet.dominant_tags.length > 0
                          ? errorSet.dominant_tags.join(" / ")
                          : "暂无主导错误标签"}
                      </p>
                      <p className="mt-3 text-xs text-ink/55">
                        创建 {formatDate(errorSet.created_at)} · 更新{" "}
                        {formatDate(errorSet.updated_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="border border-ink/20 bg-white/60 px-3 py-2 text-sm text-ink transition hover:border-clay hover:text-clay"
                        href={`/practice?knowledge_point_id=${errorSet.knowledge_point_id}`}
                      >
                        创建练习
                      </Link>
                      {errorSet.status === "active" ? (
                        <form action={resolveErrorSetAction}>
                          <input name="error_set_id" type="hidden" value={errorSet.id} />
                          <button className="border border-moss bg-moss px-3 py-2 text-sm text-paper transition hover:bg-ink">
                            标记已解决
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

async function resolveErrorSetAction(formData: FormData) {
  "use server";

  await resolveErrorSet(getRequiredFormValue(formData, "error_set_id"));
  revalidatePath("/");
  revalidatePath("/error-sets");
  revalidatePath("/practice");
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

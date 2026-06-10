import Link from "next/link";

export const topNavItems = [
  ["/", "工作台"],
  ["/domains", "知识结构"],
  ["/questions", "题库"],
  ["/practice", "练习"],
  ["/mastery", "画像"],
  ["/attempts", "答题记录"],
  ["/error-sets", "错误集"],
  ["/records", "记录"],
  ["/integrations", "接入"],
  ["/settings", "设置"]
] as const;

export function TopNav({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap gap-2 text-sm">
      {topNavItems.map(([href, label]) => (
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

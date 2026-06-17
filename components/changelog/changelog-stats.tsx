import type { ChangelogDay, ChangeType } from "@/lib/changelog";

export const TYPE_LABELS: Record<ChangeType, string> = {
  feat: "Feature",
  fix: "Fix",
  refactor: "Refactor",
  perf: "Performance",
  style: "Style",
  test: "Test",
  docs: "Docs",
  build: "Build",
  ops: "Ops",
  chore: "Chore",
  ci: "CI",
};

// Highlighter chip per type — muted tones that sit on warm paper. Each defines
// BOTH light and dark (ADR 0005). A deliberate divergence from single-accent
// (ADR 0006): the type is the one place color earns its keep. The value is pure
// color (no padding), so it doubles as the fill for the distribution bar below.
export const TYPE_CHIP: Record<ChangeType, string> = {
  feat: "bg-[#dde8cf] text-[#4a6b1f] dark:bg-[#202a16] dark:text-[#9ec97a]",
  fix: "bg-[#f3e3c4] text-[#8a5208] dark:bg-[#2b2113] dark:text-[#dca85a]",
  refactor: "bg-[#d9e5f0] text-[#2c5578] dark:bg-[#16222f] dark:text-[#84b2d6]",
  perf: "bg-[#e7e0f1] text-[#5d3a8a] dark:bg-[#241d31] dark:text-[#b59ddd]",
  style: "bg-[#ecdcec] text-[#7a3c7a] dark:bg-[#271a27] dark:text-[#c79ac7]",
  test: "bg-[#f0dde1] text-[#8e3a4e] dark:bg-[#2a181c] dark:text-[#d98ea0]",
  docs: "bg-[#d6e8e4] text-[#2a665f] dark:bg-[#142421] dark:text-[#74c0b5]",
  build: "bg-[#e4e1cb] text-[#6a6128] dark:bg-[#23210f] dark:text-[#bcb072]",
  ops: "bg-[#dde2ea] text-[#3f5168] dark:bg-[#181d24] dark:text-[#8ea4c0]",
  chore: "bg-[#e7e0d2] text-[#6a6051] dark:bg-[#262019] dark:text-[#a0937f]",
  ci: "bg-[#e0e2e6] text-[#4a5563] dark:bg-[#1c1f24] dark:text-[#98a2b0]",
};

// Stable display order; the distribution itself is sorted by count.
const TYPE_ORDER: ChangeType[] = [
  "feat",
  "fix",
  "refactor",
  "perf",
  "style",
  "test",
  "docs",
  "build",
  "ops",
  "chore",
  "ci",
];

function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * At-a-glance summary above the log: how much shipped over time (a per-day
 * activity axis) and the mix of work (a type-distribution bar). Pure render
 * from the same parsed changelog data — no charting lib, just CSS, semantic
 * tokens, and the existing type palette. Stays minimal by design.
 */
export function ChangelogStats({ days }: { days: ChangelogDay[] }) {
  const entries = days.flatMap((d) => d.entries);
  const total = entries.length;
  if (total === 0) return null;

  const counts = new Map<ChangeType, number>();
  for (const e of entries) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  const dist = TYPE_ORDER.filter((t) => counts.has(t))
    .map((t) => ({ type: t, n: counts.get(t)! }))
    .sort((a, b) => b.n - a.n);

  // Oldest → newest (days arrive newest-first) so the axis reads left to right.
  const byDay = [...days].reverse().map((d) => ({
    date: d.date,
    n: d.entries.length,
  }));
  const maxDay = Math.max(...byDay.map((d) => d.n));

  return (
    <section className="mt-12 grid gap-x-12 gap-y-10 border-y border-rule py-8 sm:grid-cols-2">
      {/* Activity over time — a commit-per-day axis. One neutral tone so it
          doesn't compete with the type colors on the right. */}
      <div>
        <div className="flex items-baseline justify-between">
          <p className="label-caps text-faint">Activity</p>
          <p className="font-mono text-xs text-faint tabular-nums">
            {total} commits · {byDay.length} days
          </p>
        </div>
        <div className="mt-4 flex h-16 items-end gap-1">
          {byDay.map((d) => (
            <div
              key={d.date}
              title={`${shortDate(d.date)} — ${d.n} commit${d.n === 1 ? "" : "s"}`}
              style={{ height: `${Math.max(6, (d.n / maxDay) * 100)}%` }}
              className="flex-1 rounded-sm bg-ink/15 transition-colors hover:bg-accent dark:bg-ink/20"
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[0.65rem] uppercase tracking-[0.15em] text-faint">
          <span>{shortDate(byDay[0].date)}</span>
          <span>{shortDate(byDay[byDay.length - 1].date)}</span>
        </div>
      </div>

      {/* Type distribution — a stacked bar reusing the chip palette + a legend. */}
      <div>
        <p className="label-caps text-faint">Distribution</p>
        <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full">
          {dist.map((d) => (
            <span
              key={d.type}
              title={`${TYPE_LABELS[d.type]} — ${d.n}`}
              style={{ flexGrow: d.n, flexBasis: 0 }}
              className={TYPE_CHIP[d.type] ?? TYPE_CHIP.chore}
            />
          ))}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
          {dist.map((d) => (
            <li key={d.type} className="flex items-center gap-1.5">
              <span
                className={`label-caps rounded-[3px] px-1.5 py-0.5 ${TYPE_CHIP[d.type] ?? TYPE_CHIP.chore}`}
              >
                {TYPE_LABELS[d.type] ?? d.type}
              </span>
              <span className="font-mono text-xs text-faint tabular-nums">
                {d.n}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

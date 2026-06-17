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

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_MS = 86_400_000;

function isoOf(t: number): string {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface Cell {
  date: string;
  count: number;
}

/**
 * Bucket the calendar into GitHub-style week columns (Sun→Sat rows), spanning
 * the Sunday on/before the first ship date through the Saturday on/after the
 * last. Deterministic — bounded by real data, no dependence on "now".
 */
function buildWeeks(days: ChangelogDay[]): {
  weeks: Cell[][];
  monthLabels: string[];
  max: number;
} {
  const counts = new Map<string, number>();
  for (const d of days) counts.set(d.date, d.entries.length);
  const dates = [...counts.keys()].sort();
  const toUTC = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };

  let start = toUTC(dates[0]);
  start -= new Date(start).getUTCDay() * DAY_MS; // back to Sunday
  let end = toUTC(dates[dates.length - 1]);
  end += (6 - new Date(end).getUTCDay()) * DAY_MS; // forward to Saturday

  let weeks: Cell[][] = [];
  let col: Cell[] = [];
  for (let t = start; t <= end; t += DAY_MS) {
    const iso = isoOf(t);
    col.push({ date: iso, count: counts.get(iso) ?? 0 });
    if (new Date(t).getUTCDay() === 6) {
      weeks.push(col);
      col = [];
    }
  }
  if (col.length) weeks.push(col);

  // Cap to the most recent ~year (53 columns) so the grid always fits the text
  // column without horizontal scrolling; older weeks roll off the left.
  const MAX_WEEKS = 53;
  if (weeks.length > MAX_WEEKS) weeks = weeks.slice(-MAX_WEEKS);

  // One label per week column: the month name when it changes, else "" — the
  // label text overflows its column to the right (GitHub's trick).
  let prevMonth = -1;
  const monthLabels = weeks.map((w) => {
    const month = Number(w[0].date.split("-")[1]);
    if (month !== prevMonth) {
      prevMonth = month;
      return MONTHS[month - 1];
    }
    return "";
  });

  const max = Math.max(1, ...[...counts.values()]);
  return { weeks, monthLabels, max };
}

// Empty + four accent intensities (our orange). Index 0 = no commits.
const LEVELS = [
  "bg-ink/5 dark:bg-ink/10",
  "bg-accent/30",
  "bg-accent/55",
  "bg-accent/80",
  "bg-accent",
];

function levelOf(count: number, max: number): number {
  if (count === 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
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

  const activeDays = days.length;
  const { weeks, monthLabels, max } = buildWeeks(days);

  return (
    <section className="mt-8 space-y-8 border-y border-rule py-7">
      {/* Activity — a GitHub-style contribution heatmap in accent intensities. */}
      <div>
        <div className="flex items-baseline justify-between">
          <p className="label-caps text-faint">Activity</p>
          <p className="font-mono text-xs text-faint tabular-nums">
            {total} commits · {activeDays} days
          </p>
        </div>

        {/* Capped to a year of columns, sized to fit the text column — no
            scrolling, no overflow clipping, so tooltips show in full. They align
            to the edge on the first/last week so they never run off-screen. */}
        <div className="mt-3">
          <div className="inline-flex flex-col gap-1">
            {/* Month labels — each sits at its week column and overflows right. */}
            <div className="flex gap-[3px] pl-0">
              {monthLabels.map((label, i) => (
                <span
                  key={i}
                  className="w-2.5 shrink-0 whitespace-nowrap font-mono text-[0.6rem] leading-none text-faint"
                >
                  {label}
                </span>
              ))}
            </div>
            {/* Week columns, Sun→Sat top→bottom. */}
            <div className="flex gap-[3px]">
              {weeks.map((week, i) => {
                const align =
                  i === 0
                    ? "left-0"
                    : i === weeks.length - 1
                      ? "right-0"
                      : "left-1/2 -translate-x-1/2";
                return (
                  <div key={i} className="flex flex-col gap-[3px]">
                    {week.map((cell) => (
                      <span key={cell.date} className="group relative block">
                        <span
                          className={`block size-2.5 rounded-[2px] ${LEVELS[levelOf(cell.count, max)]}`}
                        />
                        {/* Hover tooltip — date + commit count for that day. */}
                        <span
                          className={`pointer-events-none absolute bottom-full ${align} z-20 mb-1.5 hidden whitespace-nowrap rounded-md bg-ink px-2 py-1 font-mono text-[0.65rem] leading-none text-paper shadow-md group-hover:block`}
                        >
                          {cell.count} commit{cell.count === 1 ? "" : "s"} ·{" "}
                          {longDate(cell.date)}
                        </span>
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend — Less → More, mirroring GitHub. */}
        <div className="mt-3 flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-faint">
          <span>Less</span>
          {LEVELS.map((c, i) => (
            <span key={i} className={`size-2.5 rounded-[2px] ${c}`} />
          ))}
          <span>More</span>
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

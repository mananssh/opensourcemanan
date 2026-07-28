/**
 * A GitHub-style activity calendar: one cell per day for the trailing 53 weeks,
 * shaded by how many titles were logged that day. Pure/presentational — builds
 * the week columns from `dayCounts` (YYYY-MM-DD → count). Uses the accent token
 * at graded opacity so it themes for light and dark automatically.
 */
const WEEKS = 53;

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function intensity(count: number): string {
  if (count <= 0) return "bg-rule/40";
  if (count === 1) return "bg-accent/30";
  if (count === 2) return "bg-accent/55";
  if (count === 3) return "bg-accent/80";
  return "bg-accent";
}

export function Heatmap({ dayCounts }: { dayCounts: Record<string, number> }) {
  // Anchor to the most recent Saturday so columns are whole weeks (Sun–Sat).
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (WEEKS * 7 - 1));

  const weeks: { date: string; count: number; future: boolean }[][] = [];
  const cursor = new Date(start);
  const todayStr = ymd(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())));
  for (let w = 0; w < WEEKS; w++) {
    const col: { date: string; count: number; future: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = ymd(cursor);
      col.push({ date, count: dayCounts[date] ?? 0, future: date > todayStr });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(col);
  }

  const total = Object.values(dayCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="border border-rule bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-faint">
          Watch activity · 12 months
        </p>
        <p className="font-mono text-[0.6rem] text-faint">{total} logged</p>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-[3px]">
          {weeks.map((col, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {col.map((cell) => (
                <span
                  key={cell.date}
                  title={cell.future ? undefined : `${cell.date}: ${cell.count}`}
                  className={`h-2.5 w-2.5 rounded-[2px] ${
                    cell.future ? "bg-transparent" : intensity(cell.count)
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-faint">Less</span>
        {["bg-rule/40", "bg-accent/30", "bg-accent/55", "bg-accent/80", "bg-accent"].map((c) => (
          <span key={c} className={`h-2.5 w-2.5 rounded-[2px] ${c}`} />
        ))}
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-faint">More</span>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Experience } from "@/db/schema";

function mon(d: Date | null): string | null {
  return d
    ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;
}
function range(start: Date | null, end: Date | null): string {
  const s = mon(start);
  if (!s) return "";
  return `${s} – ${end ? mon(end) : "present"}`;
}

/** Experience timeline — numbered (it's a real chronological sequence). */
export function Timeline({ items }: { items: Experience[] }) {
  return (
    <ol className="space-y-9">
      {items.map((e, i) => (
        <li key={e.id} className="grid grid-cols-[2.5rem_1fr] gap-x-4">
          <span className="pt-1 font-mono text-sm text-faint tabular-nums">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Link
                href={`/experience/${e.id}`}
                scroll={false}
                className="font-display text-xl font-medium text-ink transition-colors hover:text-accent"
              >
                {e.role} · {e.org}
              </Link>
              <span className="font-mono text-xs text-faint">
                {range(e.startedAt, e.endedAt)}
                {e.location ? ` · ${e.location}` : ""}
              </span>
            </div>
            {e.blurb && (
              <p className="mt-2 max-w-prose font-body text-muted">{e.blurb}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

import Link from "next/link";
import { listHackathons } from "@/lib/portfolio/queries";

export default async function AdminHackathonsList() {
  const items = await listHackathons();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Hackathons</h1>
        <Link
          href="/admin/hackathons/new"
          className="rounded-full bg-accent px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
        >
          New hackathon
        </Link>
      </div>
      <ul className="divide-y divide-rule rounded-lg border border-rule">
        {items.map((h) => (
          <li key={h.id}>
            <Link
              href={`/admin/hackathons/${h.id}`}
              className="group flex items-baseline justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent-soft/40"
            >
              <span className="font-display text-ink transition-colors group-hover:text-accent">
                {h.event}
              </span>
              <span className="font-mono text-xs text-faint">{h.result}</span>
            </Link>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-6 font-mono text-sm text-faint">No hackathons yet.</li>
        )}
      </ul>
    </div>
  );
}

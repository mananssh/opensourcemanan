import Link from "next/link";
import { listExperiences } from "@/lib/portfolio/queries";

export default async function AdminExperienceList() {
  const items = await listExperiences();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Experience</h1>
        <Link
          href="/admin/experience/new"
          className="rounded-full bg-accent px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
        >
          New experience
        </Link>
      </div>
      <ul className="divide-y divide-rule rounded-lg border border-rule">
        {items.map((e) => (
          <li key={e.id}>
            <Link
              href={`/admin/experience/${e.id}`}
              className="group flex items-baseline justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent-soft/40"
            >
              <span className="font-display text-ink transition-colors group-hover:text-accent">
                {e.role} · {e.org}
              </span>
              <span className="font-mono text-xs text-faint">{e.location ?? ""}</span>
            </Link>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-6 font-mono text-sm text-faint">No experience yet.</li>
        )}
      </ul>
    </div>
  );
}

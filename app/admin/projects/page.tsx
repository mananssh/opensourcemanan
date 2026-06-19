import Link from "next/link";
import { listProjects } from "@/lib/portfolio/queries";

export default async function AdminProjectsList() {
  const projects = await listProjects();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Projects</h1>
        <Link
          href="/admin/projects/new"
          className="rounded-full bg-accent px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
        >
          New project
        </Link>
      </div>
      <ul className="divide-y divide-rule rounded-lg border border-rule">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/admin/projects/${p.id}`}
              className="group flex items-baseline justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent-soft/40"
            >
              <span className="font-display text-ink transition-colors group-hover:text-accent">
                {p.name}
                {p.featured && (
                  <span className="ml-2 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-accent">
                    featured
                  </span>
                )}
              </span>
              <span className="font-mono text-xs text-faint">{p.slug}</span>
            </Link>
          </li>
        ))}
        {projects.length === 0 && (
          <li className="px-4 py-6 font-mono text-sm text-faint">No projects yet.</li>
        )}
      </ul>
    </div>
  );
}

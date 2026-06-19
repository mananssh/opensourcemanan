import Link from "next/link";
import { listCapabilities } from "@/lib/portfolio/queries";

export default async function AdminCapabilitiesList() {
  const items = await listCapabilities();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Capabilities</h1>
        <Link
          href="/admin/capabilities/new"
          className="rounded-full bg-accent px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
        >
          New group
        </Link>
      </div>
      <ul className="divide-y divide-rule rounded-lg border border-rule">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/admin/capabilities/${c.id}`}
              className="group flex items-baseline justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent-soft/40"
            >
              <span className="font-display text-ink transition-colors group-hover:text-accent">
                {c.groupName}
              </span>
              <span className="font-mono text-xs text-faint">{c.items.length} items</span>
            </Link>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-6 font-mono text-sm text-faint">No groups yet.</li>
        )}
      </ul>
    </div>
  );
}

import Link from "next/link";
import {
  getProfile,
  listProjects,
  listExperiences,
  listHackathons,
  listCapabilities,
} from "@/lib/portfolio/queries";

export default async function AdminOverview() {
  const [profile, projects, experiences, hackathons, capabilities] =
    await Promise.all([
      getProfile(),
      listProjects(),
      listExperiences(),
      listHackathons(),
      listCapabilities(),
    ]);

  const cards = [
    { href: "/admin/profile", label: "Profile", count: profile ? "set" : "not set" },
    { href: "/admin/projects", label: "Projects", count: projects.length },
    { href: "/admin/experience", label: "Experience", count: experiences.length },
    { href: "/admin/hackathons", label: "Hackathons", count: hackathons.length },
    { href: "/admin/capabilities", label: "Capabilities", count: capabilities.length },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex items-baseline justify-between rounded-lg border border-rule bg-surface p-5 transition-colors hover:border-accent"
          >
            <span className="font-display text-lg text-ink transition-colors group-hover:text-accent">
              {c.label}
            </span>
            <span className="font-mono text-sm text-faint tabular-nums">{c.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

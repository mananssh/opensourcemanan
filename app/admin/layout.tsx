import type { Metadata } from "next";
import Link from "next/link";
import { requireOwner } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Portfolio admin",
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/experience", label: "Experience" },
  { href: "/admin/hackathons", label: "Hackathons" },
  { href: "/admin/capabilities", label: "Capabilities" },
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireOwner(); // owner-only; redirects otherwise

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-10 border-b border-rule pb-6">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
          Portfolio admin
        </p>
        <nav className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="font-mono text-xs text-muted transition-colors hover:text-accent"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}

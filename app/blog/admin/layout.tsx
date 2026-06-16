import Link from "next/link";
import { requireOwner } from "@/lib/auth";

const navCls =
  "font-mono text-[0.7rem] uppercase tracking-[0.15em] text-muted transition-colors hover:text-accent";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireOwner(); // gate everything under /blog/admin

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-rule pb-5">
        <span className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
          Admin<span className="text-accent">.</span>
        </span>
        <nav className="flex flex-wrap gap-5">
          <Link href="/blog/admin" className={navCls}>Dashboard</Link>
          <Link href="/blog/admin/posts/new" className={navCls}>New post</Link>
          <Link href="/blog/admin/categories/new" className={navCls}>New category</Link>
          <Link href="/blog" className={navCls}>View blog ↗</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}

import Link from "next/link";
import { siteNav } from "@/lib/site-nav";

/**
 * Site header. Renders the nav from the `siteNav` config — adding a link is a
 * config edit, not a code change.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-black/80">
      <nav className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-medium tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          Manan Shah
        </Link>
        <ul className="flex items-center gap-6 text-sm">
          {siteNav
            .filter((item) => item.href !== "/")
            .map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </header>
  );
}

import Link from "next/link";
import { siteNav } from "@/lib/site-nav";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Editorial Logbook header: OSM wordmark + hairline rule, nav from the
 * `siteNav` config (config-driven surface), and the global theme toggle.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-sm">
      <nav className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-5">
        <Link href="/" className="group inline-flex items-baseline gap-0.5">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            OSM
          </span>
          <span className="font-display text-xl leading-none text-accent">.</span>
        </Link>

        <div className="flex items-center gap-7">
          <ul className="flex items-center gap-6">
            {siteNav
              .filter((item) => item.href !== "/")
              .map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="label-caps text-muted transition-colors hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

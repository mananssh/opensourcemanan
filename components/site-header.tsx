import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";

/**
 * Editorial site header. OSM is the directory — the home page's index lists the
 * verticals, so the navbar stays minimal: wordmark (→ home) + theme toggle +
 * the global auth control.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-sm">
      <nav className="container-editorial flex items-center justify-between py-5">
        <Link href="/" className="inline-flex items-baseline gap-0.5">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            OSM
          </span>
          <span className="font-display text-xl leading-none text-accent">.</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AuthButton />
        </div>
      </nav>
    </header>
  );
}

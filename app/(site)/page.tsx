import Link from "next/link";
import { siteNav } from "@/lib/site-nav";

export const metadata = {
  description:
    "The OSM front page is becoming a portfolio. In the meantime, the blog, thought dump, and changelog are already open.",
};

export default function Home() {
  // Everything that's already live (Home excluded — that's this page).
  const live = siteNav.filter((item) => item.href !== "/");

  return (
    <main className="container-editorial pt-24 sm:pt-32">
      <p className="label-caps text-faint">OSM — Vol. 01</p>

      <h1 className="mt-6 font-display text-6xl font-light leading-[1.02] tracking-tight text-ink sm:text-7xl">
        A portfolio is
        <br />
        on its way
        <span className="accent-pulse text-accent">.</span>
      </h1>

      <p className="mt-8 max-w-prose font-body text-lg leading-relaxed text-muted">
        This front page is being rebuilt into my portfolio. Until it lands,
        everything else is already open —{" "}
        <span className="text-ink">have a look around.</span>
      </p>

      {/* Meanwhile — don't strand visitors; point them at what's live. */}
      <section className="mt-16">
        <p className="label-caps text-faint">Meanwhile</p>
        <ul className="mt-5">
          {live.map((item, i) => (
            <li key={item.href} className="border-t border-rule last:border-b">
              <Link
                href={item.href}
                className="group flex items-baseline gap-5 py-5 transition-colors"
              >
                <span className="font-mono text-xs text-faint tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">
                  <span className="font-display text-2xl text-ink transition-colors group-hover:text-accent">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="mt-1 block font-body text-base text-muted">
                      {item.description}
                    </span>
                  )}
                </span>
                <span
                  aria-hidden
                  className="font-mono text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

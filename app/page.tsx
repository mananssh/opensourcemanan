import Link from "next/link";
import { siteNav } from "@/lib/site-nav";

export default function Home() {
  const sections = siteNav.filter((item) => item.href !== "/");

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pt-20 sm:pt-28">
      {/* Masthead */}
      <p className="label-caps text-faint">Vol. 01 — Open-source almanac</p>

      <h1 className="mt-6 font-display text-5xl font-light leading-[1.05] tracking-tight text-ink sm:text-6xl">
        An open-source
        <br />
        corner of the
        <br />
        internet<span className="text-accent">.</span>
      </h1>

      <p className="mt-8 max-w-prose font-body text-lg leading-relaxed text-muted">
        <span className="font-medium text-ink">OSM</span> is where I keep the
        things worth keeping in the open — a portfolio, writing, experiments,
        and a running log of what I ship. One system, built to grow.
      </p>

      {/* Section index — editorial table of contents */}
      <section className="mt-20">
        <p className="label-caps text-faint">Index</p>
        <ul className="mt-5">
          {sections.map((item, i) => (
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

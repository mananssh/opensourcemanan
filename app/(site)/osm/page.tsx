import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { siteNav } from "@/lib/site-nav";

export const metadata: Metadata = {
  title: "OSM",
  description: "What OSM is, in a few words.",
};

// Staggered reveal delay helper.
const delay = (ms: number): CSSProperties =>
  ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

export default function OsmPage() {
  // The verticals to jump to — exclude Home and this page itself.
  const sections = siteNav.filter(
    (item) => item.href !== "/" && item.href !== "/osm",
  );

  return (
    <main className="container-editorial relative overflow-hidden pt-24 sm:pt-32">
      {/* Oversized ghosted wordmark — depth, not decoration. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-16 select-none font-display text-[42vw] font-semibold leading-none text-ink/[0.04] sm:-right-24 sm:text-[24rem] dark:text-ink/[0.07]"
      >
        OSM
      </span>

      <div className="relative">
        <p className="reveal label-caps text-faint" style={delay(0)}>
          What is OSM
        </p>

        <h1
          className="reveal mt-7 font-display text-6xl font-light leading-[0.98] tracking-tight text-ink sm:text-7xl"
          style={delay(90)}
        >
          Everything I make,
          <br />
          in the open
          <span className="accent-pulse text-accent">.</span>
        </h1>

        <p
          className="reveal mt-9 max-w-prose font-body text-xl leading-relaxed text-muted"
          style={delay(220)}
        >
          OSM is my corner of the internet — portfolio, writing, experiments, a
          reel of everything I watch, and a live log of what ships.{" "}
          <span className="text-ink">One system, built to grow.</span> Open by
          default, private only by exception.
        </p>

        <p
          className="reveal mt-6 max-w-prose font-body text-lg leading-relaxed text-muted"
          style={delay(300)}
        >
          Each vertical wears its own skin — different type, different rhythm,
          different mood. That&rsquo;s deliberate, not drift: every one is its
          own space for its own kind of thinking, free to take creative risks on
          its own terms.{" "}
          <span className="text-ink">
            They&rsquo;re not meant to match.
          </span>{" "}
          What links them is OSM and the shared machinery underneath — not a
          single template.
        </p>

        {/* Ethos strip */}
        <ul
          className="reveal mt-12 flex flex-wrap items-center gap-x-3 gap-y-2"
          style={delay(360)}
        >
          <li>
            <span className="label-caps text-muted">Systems, not pages</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-accent">·</span>
            <span className="label-caps text-muted">Open by default</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="text-accent">·</span>
            <Link
              href="/changelog"
              className="group label-caps inline-flex items-center gap-1.5 text-accent transition-colors hover:text-ink"
            >
              View the changelog
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </li>
        </ul>

        <p
          className="reveal mt-16 max-w-prose font-display text-2xl font-light italic leading-snug text-ink"
          style={delay(500)}
        >
          If it&rsquo;s worth building, it&rsquo;s worth building in public.
        </p>

        {/* Index — editorial table of contents into the verticals. */}
        <section className="reveal mt-20" style={delay(640)}>
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
      </div>
    </main>
  );
}

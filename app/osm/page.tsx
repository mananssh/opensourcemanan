import type { Metadata } from "next";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "OSM",
  description: "What OSM is, in a few words.",
};

// Staggered reveal delay helper.
const delay = (ms: number): CSSProperties =>
  ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

const ETHOS = [
  "Systems, not pages",
  "DRY or don't",
  "Open by default",
  "Light & dark, always",
];

export default function OsmPage() {
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
          OSM is my corner of the internet — portfolio, writing, experiments,
          and a live log of what ships.{" "}
          <span className="text-ink">One system, built to grow.</span> Open by
          default, private only by exception.
        </p>

        {/* Ethos strip */}
        <ul
          className="reveal mt-12 flex flex-wrap items-center gap-x-3 gap-y-2"
          style={delay(360)}
        >
          {ETHOS.map((item, i) => (
            <li key={item} className="flex items-center gap-3">
              {i > 0 && <span className="text-accent">·</span>}
              <span className="label-caps text-muted">{item}</span>
            </li>
          ))}
        </ul>

        <p
          className="reveal mt-16 max-w-prose font-display text-2xl font-light italic leading-snug text-ink"
          style={delay(500)}
        >
          If it&rsquo;s worth building, it&rsquo;s worth building in public.
        </p>

        {/* Colophon — the last page of the book. */}
        <div
          className="reveal mt-20 border-t border-rule pt-6"
          style={delay(640)}
        >
          <p className="label-caps text-faint">Colophon</p>
          <p className="mt-3 font-mono text-xs leading-relaxed text-muted">
            Set in Fraunces, Newsreader &amp; JetBrains Mono.
            <br />
            Built with Next.js, shipped on Vercel.
            <br />
            The open-source almanac — Vol. 01.
          </p>
        </div>
      </div>
    </main>
  );
}

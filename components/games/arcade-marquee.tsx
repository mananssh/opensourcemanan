"use client";

import { useReducedMotion } from "motion/react";

const TICKS = [
  "ARCD",
  "Insert coin",
  "Stage open",
  "1UP",
  "Cabinets",
  "After hours",
  "Play",
  "High score",
] as const;

function MarqueeChunk() {
  return (
    <div className="arcd-marquee__chunk" aria-hidden>
      {TICKS.map((tick) => (
        <span key={tick}>
          {tick}
          <span data-sep>·</span>
        </span>
      ))}
    </div>
  );
}

/** Full-bleed kinetic marquee — CSS scroll; static when reduced motion. */
export function ArcadeMarquee() {
  const reduce = useReducedMotion();

  return (
    <div className="arcd-marquee" role="presentation">
      <div
        className="arcd-marquee__track"
        style={reduce ? { animation: "none" } : undefined}
      >
        <MarqueeChunk />
        <MarqueeChunk />
      </div>
      <span className="sr-only">
        Arcade marquee: ARCD, insert coin, stage open, cabinets after hours.
      </span>
    </div>
  );
}

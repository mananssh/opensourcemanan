"use client";

import type { ReactNode } from "react";
import { useReducedMotion, motion } from "motion/react";

/**
 * Kinetic-type Reel landing — see docs/design/movies.md ("Last Showing").
 */
export function ReelHero({
  cta,
}: {
  cta: ReactNode;
}) {
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? { initial: false as const, animate: { y: "0%", opacity: 1 } }
      : {
          initial: { y: "110%", opacity: 0 },
          animate: { y: "0%", opacity: 1 },
          transition: {
            duration: 0.9,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <section className="overflow-x-clip">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-accent-2">
          Lot open · films &amp; TV
        </p>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-faint">
          After the credits
        </p>
      </div>

      <div className="mt-6 overflow-hidden">
        <motion.h1
          {...rise(0.04)}
          className="reel-wordmark font-display text-[clamp(5rem,18vw,11rem)] text-ink"
        >
          Reel
        </motion.h1>
      </div>

      <motion.p
        {...(reduce
          ? { initial: false as const, animate: { opacity: 1 } }
          : {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { duration: 0.45, delay: 0.32 },
            })}
        className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl"
      >
        Everything you watch, logged like a one-sheet on the lot. Rate it, stack
        the hours, share the handle — no algorithm, no tape hiss.
      </motion.p>

      <motion.div
        {...(reduce
          ? { initial: false as const, animate: { opacity: 1 } }
          : {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { duration: 0.4, delay: 0.45 },
            })}
        className="mt-10"
      >
        {cta}
      </motion.div>
    </section>
  );
}

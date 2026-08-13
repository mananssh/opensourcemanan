"use client";

import { useReducedMotion, motion } from "motion/react";
import { StageCta } from "@/components/games/stage-cta";
import { ArcadeMarquee } from "@/components/games/arcade-marquee";

/**
 * ARCD hero — marquee archetype + clipped display type.
 * See docs/design/games.md ("Cabinet After Hours").
 */
export function ArcadeHero() {
  const reduce = useReducedMotion();

  const line = (delay: number) =>
    reduce
      ? { initial: false as const, animate: { y: "0%", opacity: 1 } }
      : {
          initial: { y: "110%", opacity: 0 },
          animate: { y: "0%", opacity: 1 },
          transition: {
            duration: 0.85,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <section className="relative overflow-x-clip">
      <div className="mx-auto flex w-full max-w-6xl items-baseline justify-between px-6 pt-8 sm:pt-10">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-faint">
          Index 001 — cabinets
        </p>
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-accent-2">
          Coin ready
        </p>
      </div>

      <div className="mt-6">
        <ArcadeMarquee />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-[clamp(4rem,12vh,8rem)] pt-[clamp(2.5rem,8vh,5rem)]">
        <div className="overflow-hidden">
          <motion.h1
            {...line(0.05)}
            className="arcd-wordmark font-display text-[clamp(5rem,18vw,12rem)] font-bold text-ink"
            aria-label="ARCD"
          >
            ARCD
          </motion.h1>
        </div>

        <motion.p
          {...(reduce
            ? { initial: false as const, animate: { opacity: 1 } }
            : {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: 0.5, delay: 0.35 },
              })}
          className="mt-6 max-w-md text-lg leading-relaxed text-muted sm:text-xl"
        >
          Playable experiments still humming after the lights go out —
          single-player, multiplayer, whatever lands next.
        </motion.p>

        <motion.div
          {...(reduce
            ? { initial: false as const, animate: { opacity: 1 } }
            : {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: 0.45, delay: 0.45 },
              })}
          className="mt-10"
        >
          <StageCta
            onClick={() => {
              document.getElementById("catalog")?.scrollIntoView({
                behavior: reduce ? "auto" : "smooth",
                block: "start",
              });
            }}
          >
            Insert coin
          </StageCta>
        </motion.div>
      </div>
    </section>
  );
}

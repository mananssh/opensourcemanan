"use client";

import { useReducedMotion, motion } from "motion/react";
import { StageCta } from "@/components/games/stage-cta";

/**
 * ARCD hero — marque + unDraw Gaming Controller (licensed).
 * See docs/design/games.md and public/games/art/LICENSES.md.
 */
export function ArcadeHero() {
  const reduce = useReducedMotion();

  const fade = (delay: number) =>
    reduce
      ? { initial: false as const, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: {
            duration: 0.55,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <section className="relative">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="order-2 text-left lg:order-1">
          <motion.p
            {...fade(0)}
            className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-faint"
          >
            Arcade
          </motion.p>

          <motion.h1
            {...fade(0.06)}
            className="arcd-wordmark mt-4 font-display text-[clamp(4rem,12vw,7.5rem)] font-bold text-ink"
          >
            ARCD
            <span className="text-accent" aria-hidden>
              .
            </span>
          </motion.h1>

          <motion.p
            {...fade(0.1)}
            className="mt-6 max-w-sm text-lg leading-relaxed text-muted"
          >
            Playable experiments — single-player, multiplayer, and whatever lands
            next.
          </motion.p>

          <motion.div {...fade(0.14)} className="mt-8">
            <StageCta
              onClick={() => {
                document.getElementById("catalog")?.scrollIntoView({
                  behavior: reduce ? "auto" : "smooth",
                  block: "start",
                });
              }}
            >
              See what&rsquo;s on the floor
            </StageCta>
          </motion.div>
        </div>

        <motion.div
          {...fade(0.08)}
          className="order-1 flex justify-center lg:order-2 lg:justify-end"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG stays vector-crisp */}
          <img
            src="/games/art/undraw-gaming-controller.svg"
            alt=""
            width={801}
            height={664}
            decoding="async"
            fetchPriority="high"
            className="arcd-art h-auto w-full max-w-md select-none lg:max-w-lg"
          />
        </motion.div>
      </div>
    </section>
  );
}

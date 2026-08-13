"use client";

import Link from "next/link";
import { useReducedMotion, motion } from "motion/react";
import type { GameDefinition } from "@/lib/games/types";

export function GameCatalog({ games }: { games: readonly GameDefinition[] }) {
  const reduce = useReducedMotion();

  if (games.length === 0) {
    return (
      <motion.section
        id="catalog"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="border-t border-rule bg-surface/40"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-[clamp(4rem,12vh,7rem)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-accent">
              Cabinets · 00 online
            </p>
            <h2 className="arcd-wordmark mt-3 font-display text-[clamp(2.5rem,6vw,4rem)] font-bold text-ink">
              Empty bay
            </h2>
            <p className="mt-4 max-w-md text-muted">
              Nothing live yet. Titles boot here as they ship — the tubes stay
              warm.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG stays vector-crisp */}
            <img
              src="/games/art/undraw-gaming-controller.svg"
              alt=""
              width={801}
              height={664}
              decoding="async"
              className="arcd-art h-auto w-full max-w-xs select-none opacity-90 sm:max-w-sm"
            />
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <div
      id="catalog"
      className="border-t border-rule px-6 py-[clamp(4rem,12vh,7rem)]"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-baseline justify-between gap-6">
          <h2 className="arcd-wordmark font-display text-[clamp(2.5rem,6vw,4rem)] font-bold text-ink">
            Cabinets
          </h2>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint">
            {String(games.length).padStart(2, "0")} online
          </p>
        </div>
        <ul className="mt-12 divide-y divide-rule border-y border-rule">
          {games.map((game, i) => (
            <motion.li
              key={game.slug}
              initial={reduce ? false : { opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{
                duration: 0.4,
                delay: reduce ? 0 : i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={`/games/${game.slug}`}
                className="group flex cursor-pointer items-baseline justify-between gap-6 py-7"
              >
                <div className="flex min-w-0 items-baseline gap-5">
                  <span className="shrink-0 font-mono text-[0.65rem] tracking-[0.18em] text-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-2xl font-bold uppercase tracking-tight text-ink transition-colors group-hover:text-accent sm:text-3xl">
                      {game.title}
                    </p>
                    <p className="mt-1 text-sm text-muted">{game.blurb}</p>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-accent-2 transition-colors group-hover:text-accent">
                  {game.status === "live" ? "Play" : "Soon"}
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

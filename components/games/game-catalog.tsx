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
        initial={reduce ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.45 }}
        className="border-t border-rule"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-16 sm:flex-row sm:items-baseline sm:justify-between sm:py-20">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              On the floor
            </h2>
            <p className="mt-2 max-w-md text-muted">
              Nothing live yet. Titles appear here as they ship.
            </p>
          </div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint">
            0 cabinets
          </p>
        </div>
      </motion.section>
    );
  }

  return (
    <div id="catalog" className="mx-auto w-full max-w-6xl border-t border-rule px-6 py-16 sm:py-20">
      <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        On the floor
      </h2>
      <ul className="mt-10 divide-y divide-rule border-y border-rule">
        {games.map((game, i) => (
          <motion.li
            key={game.slug}
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.35, delay: reduce ? 0 : i * 0.05 }}
          >
            <Link
              href={`/games/${game.slug}`}
              className="group flex cursor-pointer items-baseline justify-between gap-6 py-6"
            >
              <div>
                <p className="font-display text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-accent">
                  {game.title}
                </p>
                <p className="mt-1 text-sm text-muted">{game.blurb}</p>
              </div>
              <span className="shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-faint">
                {game.status === "live" ? "Play" : "Soon"}
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

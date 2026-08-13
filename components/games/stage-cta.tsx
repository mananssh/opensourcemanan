"use client";

import { useReducedMotion, motion } from "motion/react";

/**
 * Primary stage CTA — sharp cabinet edge, phosphor fill.
 * See docs/design/games.md.
 */
export function StageCta({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduce ? undefined : { x: 4 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="inline-flex cursor-pointer items-center gap-3 border border-accent bg-accent px-7 py-3.5 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-ink transition-colors hover:bg-transparent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span aria-hidden className="text-accent-2">
        ▶
      </span>
      {children}
    </motion.button>
  );
}

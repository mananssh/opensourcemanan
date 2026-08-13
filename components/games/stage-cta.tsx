"use client";

import { useReducedMotion, motion } from "motion/react";
import ParticleButton from "@/components/kokonutui/particle-button";

/**
 * Primary stage CTA — Kokonut ParticleButton + Motion hover, reduced-motion safe.
 * Lucide icon inside ParticleButton is hidden; the label carries the action.
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
    <motion.div
      whileHover={reduce ? undefined : { scale: 1.02 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.18 }}
    >
      <ParticleButton
        type="button"
        size="lg"
        successDuration={reduce ? 0 : 700}
        onClick={onClick}
        className="cursor-pointer rounded-full bg-accent px-7 text-base text-accent-ink hover:bg-accent/90 [&_svg]:hidden"
      >
        {children}
      </ParticleButton>
    </motion.div>
  );
}

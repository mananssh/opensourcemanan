"use client";

import { useReducedMotion, motion } from "motion/react";
import { RingChart } from "@/components/charts/ring-chart";
import { Ring } from "@/components/charts/ring";
import { RingCenter } from "@/components/charts/ring-center";

/** Empty-stage pulse: Bklit ring showing “0 titles on deck.” */
export function StagePulse() {
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto flex w-full max-w-[11rem] flex-col items-center gap-3">
      <div className="aspect-square w-full">
        <RingChart
          data={[{ label: "On deck", value: 0, maxValue: 1 }]}
          strokeWidth={14}
          baseInnerRadius={48}
          ringGap={4}
          enterTransition={
            reduce
              ? { duration: 0 }
              : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
          }
          className="h-full w-full"
        >
          <Ring index={0} color="var(--color-chart-1)" showGlow={!reduce} />
          <RingCenter defaultLabel="titles" />
        </RingChart>
      </div>
      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.3, duration: 0.4 }}
        className="text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint"
      >
        On deck
      </motion.p>
    </div>
  );
}

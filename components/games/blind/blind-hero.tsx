"use client";

import { useReducedMotion, motion } from "motion/react";

export function BlindHero({
  onPlay,
  howOpen,
  onToggleHow,
}: {
  onPlay: () => void;
  howOpen: boolean;
  onToggleHow: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-14 sm:px-6 sm:pt-20">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-accent">
        01 · Pass-and-play
      </p>

      <h1 className="blind-wordmark relative mt-4 font-display text-[clamp(4.5rem,22vw,9rem)] text-ink">
        <span className="relative inline-block overflow-hidden">
          {reduce ? (
            "BLIND"
          ) : (
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              BLIND
            </motion.span>
          )}
          {!reduce ? (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-[42%] h-[0.28em] bg-ink"
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: [0, 1, 1, 0], originX: [0, 0, 1, 1] }}
              transition={{ duration: 2.4, delay: 0.55, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.8 }}
            />
          ) : null}
        </span>
      </h1>

      <p className="mt-6 max-w-md text-lg text-muted sm:text-xl">
        Same room. One of you has the wrong word.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onPlay}
          className="min-h-11 cursor-pointer bg-accent px-8 py-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-ink transition-opacity hover:opacity-90"
        >
          Play
        </button>
        <button
          type="button"
          onClick={onToggleHow}
          className="min-h-11 cursor-pointer border border-rule px-6 py-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted transition-colors hover:border-accent hover:text-accent"
        >
          How it works
        </button>
      </div>

      {howOpen ? (
        <div className="mt-10 max-w-lg border-l-2 border-accent pl-5 text-sm leading-relaxed text-muted">
          <p>
            Everyone gets a secret word. Most share the same one — a few
            undercovers get a close twin. Nobody is told their role. Pass the
            phone, give spoken hints, vote people out. Role is revealed on
            elimination; words stay hidden until the end.
          </p>
          <p className="mt-3">
            Play from the built-in pack, load a saved pack, or upload a WhatsApp
            export to invent words from your group chat. Chat is not stored on
            our servers.
          </p>
        </div>
      ) : null}
    </section>
  );
}

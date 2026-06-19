"use client";

import { useEffect, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_/<>{}#";

/**
 * Decrypt/scramble reveal — the "machine voice". SSR-renders the final text
 * (accessible + no layout shift); on mount it scrambles then resolves once.
 * Respects prefers-reduced-motion (shows the text, no animation).
 */
export function ScrambleText({
  text,
  className,
  durationMs = 700,
}: {
  text: string;
  className?: string;
  durationMs?: number;
}) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / durationMs);
      const revealed = Math.floor(p * text.length);
      let s = text.slice(0, revealed);
      for (let i = revealed; i < text.length; i++) {
        s += text[i] === " " ? " " : CHARS[(Math.random() * CHARS.length) | 0];
      }
      setOut(s);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, durationMs]);

  return <span className={className}>{out}</span>;
}

/**
 * Sticky-note colors. These are *content* colors (like the changelog type
 * chips) — intrinsic to the note, the same in light and dark; only the desk
 * (--paper) changes per theme. Each is a bright pastel with a legible dark ink.
 * Assigned deterministically by id so a note keeps its color + tilt forever.
 */
const STICKIES = [
  { bg: "#ffe14d", ink: "#4a3a00" }, // crayon yellow
  { bg: "#ff8fa3", ink: "#5a1020" }, // crayon pink/red
  { bg: "#7ee0a0", ink: "#0e4424" }, // crayon green
  { bg: "#7cc4ff", ink: "#0c3358" }, // crayon blue
  { bg: "#ffb15c", ink: "#5a3000" }, // crayon orange
  { bg: "#c4a0ff", ink: "#2c1560" }, // crayon purple
] as const;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface StickyStyle {
  bg: string;
  ink: string;
  rotate: number; // degrees, -2..2
}

export function stickyStyle(id: string): StickyStyle {
  const h = hash(id);
  const c = STICKIES[h % STICKIES.length];
  return { bg: c.bg, ink: c.ink, rotate: (h % 5) - 2 };
}

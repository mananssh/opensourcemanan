/**
 * Sticky-note colors. These are *content* colors (like the changelog type
 * chips) — intrinsic to the note, the same in light and dark; only the desk
 * (--paper) changes per theme. Each is a bright pastel with a legible dark ink.
 * Assigned deterministically by id so a note keeps its color + tilt forever.
 */
const STICKIES = [
  { bg: "#fdf0a8", ink: "#4a3f10" }, // butter
  { bg: "#ffd7de", ink: "#5a2230" }, // rose
  { bg: "#c8efd6", ink: "#15452f" }, // mint
  { bg: "#cfe4ff", ink: "#173557" }, // sky
  { bg: "#ffdcc0", ink: "#5a3318" }, // peach
  { bg: "#e6d6fb", ink: "#392159" }, // lilac
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

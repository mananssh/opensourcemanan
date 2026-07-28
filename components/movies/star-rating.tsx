"use client";

import { useState } from "react";
import { ratingStars } from "@/lib/movies/format";

/** A single filled star glyph (currentColor). */
function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 2.5l2.9 6.06 6.6.79-4.87 4.53 1.29 6.52L12 17.98 6 20.4l1.3-6.52L2.4 9.35l6.6-.79L12 2.5z" />
    </svg>
  );
}

/** One star with a fractional fill (0, 0.5, or 1). */
function FillStar({ fill, size }: { fill: number; size: string }) {
  return (
    <span className={`relative inline-block ${size}`}>
      <StarIcon className="h-full w-full text-rule" />
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${fill * 100}%` }}
      >
        <StarIcon className="h-full w-full text-accent" />
      </span>
    </span>
  );
}

/** Read-only rating display (1–10 half-star scale). Renders nothing if unrated. */
export function StaticStars({
  value,
  size = "h-4 w-4",
}: {
  value: number | null;
  size?: string;
}) {
  if (value == null) return null;
  const { full, half } = ratingStars(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value / 2} of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <FillStar key={i} size={size} fill={i < full ? 1 : i === full && half ? 0.5 : 0} />
      ))}
    </span>
  );
}

/**
 * Interactive rating input. Each star splits into a left half (odd value) and a
 * right half (even value) for ½-star precision on the 1–10 scale. Clicking the
 * current value clears it.
 */
export function StarRating({
  value,
  onChange,
  size = "h-6 w-6",
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  size?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  const { full, half } = ratingStars(shown);

  const set = (v: number) => onChange(v === value ? null : v);

  return (
    <span className="inline-flex items-center gap-0.5" onMouseLeave={() => setHover(null)}>
      {[0, 1, 2, 3, 4].map((i) => {
        const leftVal = i * 2 + 1;
        const rightVal = i * 2 + 2;
        return (
          <span key={i} className={`relative ${size}`}>
            <FillStar size={size} fill={i < full ? 1 : i === full && half ? 0.5 : 0} />
            <button
              type="button"
              aria-label={`Rate ${leftVal / 2} stars`}
              onMouseEnter={() => setHover(leftVal)}
              onClick={() => set(leftVal)}
              className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
            />
            <button
              type="button"
              aria-label={`Rate ${rightVal / 2} stars`}
              onMouseEnter={() => setHover(rightVal)}
              onClick={() => set(rightVal)}
              className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
            />
          </span>
        );
      })}
    </span>
  );
}

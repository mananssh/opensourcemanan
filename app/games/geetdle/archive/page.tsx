import type { Metadata } from "next";
import Link from "next/link";
import { getPuzzleNumber } from "@/lib/games/geetdle/rules";

export const metadata: Metadata = {
  title: "Geetdle Archive — Past Daily Puzzles",
  description: "Replay every past Geetdle daily Bollywood song puzzle.",
};

const EPOCH_UTC = Date.UTC(2024, 0, 1);
const fmtDate = (n: number) =>
  new Date(EPOCH_UTC + n * 86_400_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

export default function GeetdleArchivePage() {
  const today = getPuzzleNumber();
  // Newest first; today first (links to the live puzzle), then all past puzzles.
  const puzzles: number[] = [];
  for (let n = today; n >= 1; n--) puzzles.push(n);

  return (
    <div className="container mx-auto px-5 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <p
          className="mb-3 text-[11px] tracking-[0.2em] text-faint"
          style={{ fontFamily: "var(--mono-family)" }}
        >
          GEETDLE ARCHIVE
        </p>
        <h1
          className="geetdle-wordmark mb-3 text-4xl text-ink sm:text-5xl"
          style={{ fontFamily: "var(--display-family)" }}
        >
          Past puzzles
        </h1>
        <p className="mb-10 max-w-xl text-base text-muted">
          Replay any earlier daily puzzle. {today} puzzles and counting.
        </p>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {puzzles.map((n) => {
            const isToday = n === today;
            return (
              <Link
                key={n}
                href={isToday ? "/games/geetdle" : `/games/geetdle/${n}`}
                className={`group flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                  isToday
                    ? "border-accent bg-accent-soft"
                    : "border-rule bg-surface hover:border-accent"
                }`}
              >
                <span>
                  <span
                    className="block text-sm font-semibold text-ink"
                    style={{ fontFamily: "var(--display-family)" }}
                  >
                    #{n}
                  </span>
                  <span className="text-xs text-faint">{fmtDate(n)}</span>
                </span>
                {isToday && (
                  <span
                    className="text-[10px] uppercase tracking-[0.12em] text-accent"
                    style={{ fontFamily: "var(--mono-family)" }}
                  >
                    Today
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

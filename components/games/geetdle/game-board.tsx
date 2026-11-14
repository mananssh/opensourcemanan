"use client";

import { useRef, useState } from "react";
import type { Guess, CategoryKey } from "@/lib/games/geetdle/types";
import Image from "next/image";

interface GameBoardProps {
  guesses: Guess[];
  /** Song-poster hint URL, revealed by the server after 7 guesses or on game end. */
  posterUrl: string | null;
  /** Audio-preview URL, revealed by the server after 3 guesses or on game end. */
  audioUrl: string | null;
  isWon: boolean;
  isLost?: boolean;
}

/** How many seconds of the track the preview hint plays before stopping. */
const PREVIEW_SECONDS = 20;

/** A play/pause control that plays a short preview of the answer's track. */
function AudioPreview({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      a.currentTime = 0;
      void a.play().catch(() => setPlaying(false));
    }
  };

  return (
    <div className="mx-auto max-w-md text-center">
      <audio
        ref={ref}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          if (e.currentTarget.currentTime >= PREVIEW_SECONDS) e.currentTarget.pause();
        }}
      />
      <button
        onClick={toggle}
        className="inline-flex items-center gap-2.5 rounded-full border border-rule bg-surface px-6 py-3 text-sm font-semibold text-ink transition-all hover:opacity-80 active:scale-[0.98]"
      >
        <span aria-hidden className="text-base leading-none">
          {playing ? "⏸" : "▶"}
        </span>
        {playing ? "Pause preview" : "Play preview"}
      </button>
    </div>
  );
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  music_director: "Music Director",
  singers: "Singer(s)",
  year: "Year",
  movie: "Movie",
  language: "Language",
  genre: "Genre",
};

export function GameBoard({
  guesses,
  posterUrl,
  audioUrl,
  isWon,
  isLost = false,
}: GameBoardProps) {
  const categories: CategoryKey[] = [
    "music_director",
    "singers",
    "year",
    "movie",
    "language",
    "genre",
  ];

  return (
    <div className="space-y-5">
      {/* Category Headers — hidden on mobile; each tile carries its own label there */}
      <div className="hidden grid-cols-6 gap-2 sm:grid">
        {categories.map((cat) => (
          <div
            key={cat}
            className="px-1 pb-1 text-center text-[10px] font-medium uppercase leading-tight tracking-[0.12em] text-faint"
            style={{ fontFamily: "var(--mono-family)" }}
          >
            {CATEGORY_LABELS[cat]}
          </div>
        ))}
      </div>

      {/* Guesses */}
      {guesses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rule py-14 text-center">
          <p className="text-sm text-muted">
            Make a guess to reveal the clues.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {guesses.map((guess, idx) => (
            <div key={idx} className="space-y-2">
              {/* Song Title Row - shown above category tiles */}
              <div className="flex items-center gap-3">
                <span
                  className="w-6 shrink-0 text-xs text-faint"
                  style={{ fontFamily: "var(--mono-family)" }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <p
                  className="truncate text-sm font-semibold text-ink"
                  style={{ fontFamily: "var(--display-family)" }}
                >
                  {guess.song_title}
                </p>
              </div>

              {/* Category Tiles Grid — 2 cols on mobile, 6 on desktop */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                {guess.feedback.map((fb, fbIdx) => (
                  <div
                    key={fbIdx}
                    className={`category-tile flex min-h-[64px] flex-col items-center justify-center gap-0.5 p-2.5 text-center text-xs font-medium leading-snug ${fb.state}`}
                  >
                    {/* Per-tile label — only shown on mobile, where the header row is hidden */}
                    <span
                      className="text-[9px] uppercase leading-none tracking-[0.1em] opacity-60 sm:hidden"
                      style={{ fontFamily: "var(--mono-family)" }}
                    >
                      {CATEGORY_LABELS[fb.category]}
                    </span>
                    <span className="break-words">{fb.value}</span>
                    {fb.category === "year" && fb.direction && (
                      <span className="text-sm font-semibold">
                        {fb.direction === "up" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audio preview (revealed by the server after 3 guesses or on game end) */}
      {audioUrl && (
        <div className="mt-10 border-t border-rule pt-8">
          <h3
            className="mb-4 text-center text-[10px] uppercase tracking-[0.12em] text-faint"
            style={{ fontFamily: "var(--mono-family)" }}
          >
            Audio Preview
          </h3>
          <AudioPreview src={audioUrl} />
          {!isWon && !isLost && (
            <p className="mt-3 text-center text-xs text-faint">
              Preview unlocked after 3 guesses
            </p>
          )}
        </div>
      )}

      {/* Song poster (revealed by the server after 7 guesses or on game end) */}
      {posterUrl && (
        <div className="mt-10 border-t border-rule pt-8">
          <h3
            className="mb-4 text-center text-[10px] uppercase tracking-[0.12em] text-faint"
            style={{ fontFamily: "var(--mono-family)" }}
          >
            Song Poster
          </h3>
          <div className="mx-auto max-w-md">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
              <Image
                src={posterUrl}
                alt="Song poster hint"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {!isWon && !isLost && (
              <p className="mt-2 text-center text-xs text-faint">
                Poster unlocked after 7 guesses
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

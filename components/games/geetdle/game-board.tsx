"use client";

import type { Guess, BollywoodSong, CategoryKey } from "@/lib/games/geetdle/types";
import Image from "next/image";

interface GameBoardProps {
  guesses: Guess[];
  dailySong: BollywoodSong;
  posterUnlocked: boolean;
  isWon: boolean;
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  music_director: "Music Director",
  singers: "Singer(s)",
  year: "Year",
  movie: "Movie",
  language: "Language",
  genre: "Genre",
};

export function GameBoard({ guesses, dailySong, posterUnlocked, isWon }: GameBoardProps) {
  const categories: CategoryKey[] = [
    "music_director",
    "singers",
    "year",
    "movie",
    "language",
    "genre",
  ];

  // Extract YouTube video ID for thumbnail
  const getYoutubeThumbnail = (url: string) => {
    const videoId = url.match(/(?:v=|\/)([\w-]{11})/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  const posterUrl = getYoutubeThumbnail(dailySong.youtube_url);

  return (
    <div className="space-y-6">
      {/* Category Headers */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {categories.map((cat) => (
          <div
            key={cat}
            className="text-center text-xs font-semibold text-muted uppercase tracking-wide p-2 bg-surface rounded"
            style={{ fontFamily: "var(--mono-family)" }}
          >
            {CATEGORY_LABELS[cat]}
          </div>
        ))}
      </div>

      {/* Guesses */}
      <div className="space-y-4">
        {guesses.map((guess, idx) => (
          <div key={idx} className="space-y-2">
            {/* Song Title Row - shown above category tiles */}
            <div className="flex items-center gap-3 p-2 bg-surface/50 rounded-lg border border-rule">
              {/* Song thumbnail placeholder */}
              <div className="flex-shrink-0 w-16 h-16 bg-accent/10 rounded overflow-hidden flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
              
              {/* Song title */}
              <div className="flex-1 min-w-0">
                <p 
                  className="font-semibold text-ink truncate text-sm"
                  style={{ fontFamily: "var(--display-family)" }}
                >
                  {guess.song_title}
                </p>
                <p className="text-xs text-muted">Guess #{idx + 1}</p>
              </div>
            </div>

            {/* Category Tiles Grid */}
            <div className="grid grid-cols-6 gap-2">
              {guess.feedback.map((fb, fbIdx) => (
                <div
                  key={fbIdx}
                  className={`category-tile p-3 text-center text-sm font-medium min-h-[60px] flex flex-col items-center justify-center ${fb.state}`}
                >
                  <span className="break-words">{fb.value}</span>
                  {fb.category === "year" && fb.direction && (
                    <span className="text-xs mt-1">
                      {fb.direction === "up" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Poster */}
      {(posterUnlocked || isWon) && posterUrl && (
        <div className="mt-8 pt-8 border-t border-rule">
          <h3 className="text-center text-sm text-muted mb-4 uppercase tracking-wide">
            Movie Poster
          </h3>
          <div className="max-w-md mx-auto">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-surface">
              <Image
                src={posterUrl}
                alt={`Poster for ${dailySong.movie}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {!isWon && (
              <p className="text-center text-xs text-faint mt-2">
                Poster unlocked after 3 guesses
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

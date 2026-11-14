"use client";

import { useRef, useState } from "react";
import type {
  Guess,
  CategoryKey,
  CategoryFeedback,
} from "@/lib/games/geetdle/types";
import Image from "next/image";

type Possibilities = {
  count: number;
  byCategory: Record<CategoryKey, string[]>;
};

interface GameBoardProps {
  guesses: Guess[];
  /** Song-poster hint URL, revealed by the server after 7 guesses or on game end. */
  posterUrl: string | null;
  /** Audio-preview URL, revealed by the server after 3 guesses or on game end. */
  audioUrl: string | null;
  isWon: boolean;
  isLost?: boolean;
  /** Narrowed candidates from all guesses so far (null until the catalog loads). */
  possibilities?: Possibilities | null;
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
  genre: "Genre",
};

const CATEGORIES: CategoryKey[] = [
  "music_director",
  "singers",
  "year",
  "movie",
  "genre",
];

/** A greyed, illustrative first-move that teaches the colour legend. */
const EXAMPLE_FEEDBACK: CategoryFeedback[] = [
  { category: "music_director", state: "wrong", value: "A.R. Rahman" },
  { category: "singers", state: "partial", value: "Arijit Singh" },
  { category: "year", state: "partial-weak", value: "2015", direction: "up" },
  { category: "movie", state: "wrong", value: "Aashiqui 2" },
  { category: "genre", state: "exact", value: "Romantic" },
];

/** One feedback tile. `onHover` drives the Possibilities panel. */
function Tile({
  fb,
  onHover,
}: {
  fb: CategoryFeedback;
  onHover?: (cat: CategoryKey | null) => void;
}) {
  return (
    <div
      className={`category-tile flex min-h-[64px] flex-col items-center justify-center gap-0.5 p-2.5 text-center text-xs font-medium leading-snug ${fb.state}`}
      onMouseEnter={onHover ? () => onHover(fb.category) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
    >
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
  );
}

/** Legend explaining the tile colours and the new fuzzy-match rules. */
function CluesLegend() {
  return (
    <details className="geetdle-legend rounded-2xl border border-rule bg-surface/60 open:bg-surface">
      <summary className="cursor-pointer select-none px-5 py-3.5 text-xs uppercase tracking-[0.15em] text-faint">
        How to read the clues
      </summary>
      <div className="space-y-4 border-t border-rule px-5 py-4 text-sm text-muted">
        <ul className="grid gap-2 sm:grid-cols-2">
          <li className="flex items-center gap-2.5">
            <span className="legend-swatch exact" /> Exact match
          </li>
          <li className="flex items-center gap-2.5">
            <span className="legend-swatch partial" /> Close — strong hint
          </li>
          <li className="flex items-center gap-2.5">
            <span className="legend-swatch partial-weak" /> Warm — looser hint
          </li>
          <li className="flex items-center gap-2.5">
            <span className="legend-swatch wrong" /> No match
          </li>
        </ul>
        <div className="space-y-1.5 text-[13px]">
          <p>
            <strong className="text-ink">Year</strong> — green exact · strong
            within 2 years · warm same decade · with ↑ / ↓ toward the answer.
          </p>
          <p>
            <strong className="text-ink">Singer(s)</strong> — green all match ·
            strong if any singer is shared.
          </p>
          <p>
            <strong className="text-ink">Genre</strong> — green exact · strong if
            in the same family (e.g. Romantic ↔ Sad, Dance ↔ Item, Devotional ↔
            Qawwali).
          </p>
          <p>
            <strong className="text-ink">Music Director</strong> &amp;{" "}
            <strong className="text-ink">Movie</strong> — exact match only.
          </p>
          <p className="pt-1 text-faint">
            Tip: once you’ve guessed, hover a clue to see which songs are still
            possible.
          </p>
        </div>
      </div>
    </details>
  );
}

/** Renders the still-possible values for a category (year collapses to a range). */
function renderValues(cat: CategoryKey, values: string[]) {
  if (values.length === 0) return <span className="text-faint">—</span>;
  if (cat === "year" && values.length > 6) {
    return (
      <span className="possibility-chip">
        {values[0]}–{values[values.length - 1]} · {values.length} years
      </span>
    );
  }
  const CAP = 12;
  const shown = values.slice(0, CAP);
  return (
    <>
      {shown.map((v) => (
        <span key={v} className="possibility-chip">
          {v}
        </span>
      ))}
      {values.length > CAP && (
        <span className="possibility-chip more">+{values.length - CAP} more</span>
      )}
    </>
  );
}

/** Stumple-style "what's still possible" panel, driven by hovering a clue. */
function PossibilitiesPanel({
  possibilities,
  hovered,
  setHovered,
}: {
  possibilities: Possibilities;
  hovered: CategoryKey | null;
  setHovered: (c: CategoryKey | null) => void;
}) {
  const active = hovered;
  return (
    <div className="geetdle-possibilities rounded-2xl border border-rule bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-[10px] uppercase tracking-[0.15em] text-faint"
          style={{ fontFamily: "var(--mono-family)" }}
        >
          Possibilities
        </h3>
        <span className="possibility-count">
          {possibilities.count.toLocaleString()} song
          {possibilities.count === 1 ? "" : "s"} still possible
        </span>
      </div>

      {active ? (
        <div>
          <p
            className="mb-2 text-[10px] uppercase tracking-[0.12em] text-muted"
            style={{ fontFamily: "var(--mono-family)" }}
          >
            {CATEGORY_LABELS[active]}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {renderValues(active, possibilities.byCategory[active])}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onMouseEnter={() => setHovered(cat)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setHovered(cat)}
              className="possibility-chip interactive"
            >
              {CATEGORY_LABELS[cat]} · {possibilities.byCategory[cat].length}
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-faint">
        Hover a clue above (or a chip here) to see what’s left.
      </p>
    </div>
  );
}

export function GameBoard({
  guesses,
  posterUrl,
  audioUrl,
  isWon,
  isLost = false,
  possibilities = null,
}: GameBoardProps) {
  const [hovered, setHovered] = useState<CategoryKey | null>(null);
  const playing = !isWon && !isLost;
  const showPossibilities = playing && guesses.length > 0 && !!possibilities;

  return (
    <div className="space-y-5">
      {/* Category Headers — hidden on mobile; each tile carries its own label there */}
      <div className="hidden grid-cols-5 gap-2 sm:grid">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onMouseEnter={() => setHovered(cat)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setHovered((h) => (h === cat ? null : cat))}
            className={`geetdle-col-head px-1 pb-1 text-center text-[10px] font-medium uppercase leading-tight tracking-[0.12em] transition-colors ${
              hovered === cat ? "text-ink" : "text-faint"
            }`}
            style={{ fontFamily: "var(--mono-family)" }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {guesses.length === 0 ? (
        /* Example row — teaches the colour legend before the first real guess. */
        <div className="space-y-5">
          <div className="geetdle-example space-y-2">
            <div className="flex items-center gap-3">
              <span
                className="w-6 shrink-0 text-xs text-faint"
                style={{ fontFamily: "var(--mono-family)" }}
              >
                EX
              </span>
              <p
                className="truncate text-sm font-semibold text-ink"
                style={{ fontFamily: "var(--display-family)" }}
              >
                Tum Hi Ho
              </p>
              <span
                className="rounded-full border border-rule px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-faint"
                style={{ fontFamily: "var(--mono-family)" }}
              >
                Example
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {EXAMPLE_FEEDBACK.map((fb, i) => (
                <Tile key={i} fb={fb} />
              ))}
            </div>
            <p className="pl-9 text-xs text-faint">
              Guess any Bollywood song — each guess is scored on these five clues.
            </p>
          </div>
          <CluesLegend />
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

              {/* Category Tiles Grid — 2 cols on mobile, 5 on desktop */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {guess.feedback.map((fb, fbIdx) => (
                  <Tile key={fbIdx} fb={fb} onHover={setHovered} />
                ))}
              </div>
            </div>
          ))}

          {showPossibilities && (
            <PossibilitiesPanel
              possibilities={possibilities}
              hovered={hovered}
              setHovered={setHovered}
            />
          )}

          {playing && <CluesLegend />}
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
          {playing && (
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
            {playing && (
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

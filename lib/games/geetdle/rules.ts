/**
 * Geetdle game rules and logic.
 *
 * Pure + client-safe (no DB import): the server scores guesses with `checkGuess`
 * and the client replays the same function over the shipped catalog to compute
 * the "possibilities" panel — so both agree on exactly what each clue means.
 */

import type {
  BollywoodSong,
  CatalogSong,
  CategoryFeedback,
  CategoryKey,
  MatchState,
  Guess,
} from "./types";

/**
 * Check if a guess matches the target song and return per-category feedback.
 * The five scored columns, in a fixed order the client relies on.
 */
export function checkGuess(
  guessSong: BollywoodSong,
  targetSong: BollywoodSong
): CategoryFeedback[] {
  const feedback: CategoryFeedback[] = [];

  // Music Director — exact match (case-insensitive)
  feedback.push({
    category: "music_director",
    state: matchExact(guessSong.music_director, targetSong.music_director),
    value: guessSong.music_director,
  });

  // Singer(s) — partial if any singer overlaps
  feedback.push({
    category: "singers",
    state: matchSingers(guessSong.singers, targetSong.singers),
    value: guessSong.singers,
  });

  // Year — exact, ±2 (strong), same decade (weak), else wrong; always a direction
  const yearState = matchYear(guessSong.year, targetSong.year);
  feedback.push({
    category: "year",
    state: yearState.state,
    value: String(guessSong.year),
    direction: yearState.direction,
  });

  // Movie — exact match
  feedback.push({
    category: "movie",
    state: matchExact(guessSong.movie, targetSong.movie),
    value: guessSong.movie,
  });

  // Genre — exact, same genre-family (strong amber), else wrong
  feedback.push({
    category: "genre",
    state: matchGenre(guessSong.genre, targetSong.genre),
    value: guessSong.genre,
  });

  return feedback;
}

/** The scored columns, in the fixed order `checkGuess` emits. */
export const CATEGORY_ORDER: CategoryKey[] = [
  "music_director",
  "singers",
  "year",
  "movie",
  "genre",
];

/**
 * Check if guess is an exact match (case-insensitive)
 */
function matchExact(guess: string, target: string): MatchState {
  return normalize(guess) === normalize(target) ? "exact" : "wrong";
}

/**
 * Check if any singer in the guess matches any in the target
 */
function matchSingers(guess: string, target: string): MatchState {
  const guessSingers = splitSingers(guess);
  const targetSingers = splitSingers(target);

  // Exact match: same set of singers
  if (
    guessSingers.length === targetSingers.length &&
    guessSingers.length > 0 &&
    guessSingers.every((g) => targetSingers.includes(g))
  ) {
    return "exact";
  }

  // Partial match: at least one shared singer
  if (guessSingers.some((g) => targetSingers.includes(g))) {
    return "partial";
  }

  return "wrong";
}

const splitSingers = (s: string): string[] =>
  s
    .split(",")
    .map((x) => normalize(x))
    .filter(Boolean);

/**
 * Year match with closeness tiers and a direction toward the answer:
 * exact → within ±2 (strong amber) → same decade (pale amber) → wrong.
 */
function matchYear(
  guess: number,
  target: number
): { state: MatchState; direction?: "up" | "down" } {
  if (guess === target) return { state: "exact" };
  const direction: "up" | "down" = guess < target ? "up" : "down";
  const diff = Math.abs(guess - target);
  if (diff <= 2) return { state: "partial", direction };
  if (Math.floor(guess / 10) === Math.floor(target / 10)) {
    return { state: "partial-weak", direction };
  }
  return { state: "wrong", direction };
}

/**
 * Genre families — a guess in the same family as the answer scores a strong
 * amber instead of a flat miss. Rap/Hip-Hop, General and Children stand alone.
 * Keyed by the normalized genre label (e.g. "Dance/Party" → "dance party").
 */
const GENRE_FAMILIES: string[][] = [
  ["romantic", "sad emotional"],
  ["dance party", "item cabaret", "wedding celebration"],
  ["devotional", "qawwali sufi"],
  ["classical ghazal", "folk regional"],
  ["motivational", "patriotic"],
];
const GENRE_FAMILY = new Map<string, number>();
GENRE_FAMILIES.forEach((fam, i) => fam.forEach((g) => GENRE_FAMILY.set(g, i)));

function matchGenre(guess: string, target: string): MatchState {
  const g = normalize(guess);
  const t = normalize(target);
  if (!g || !t) return "wrong";
  if (g === t) return "exact";
  const fg = GENRE_FAMILY.get(g);
  const ft = GENRE_FAMILY.get(t);
  if (fg !== undefined && fg === ft) return "partial";
  return "wrong";
}

/**
 * Normalize string for comparison (lowercase, collapse non-alphanumerics to
 * single spaces). "Dance/Party" and "dance  party" both become "dance party".
 */
function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Check if the guess won the game
 */
export function isWinningGuess(feedback: CategoryFeedback[]): boolean {
  return feedback.every((f) => f.state === "exact");
}

// --- "Possibilities" filter (client-side) -------------------------------------

/** Lift a lean catalog row into the shape the pure scorer expects. */
export function catalogToBollywood(s: CatalogSong): BollywoodSong {
  return {
    song_title: s.song_title,
    movie: s.movie,
    music_director: s.music_director,
    singers: s.singers,
    year: s.year,
    language: "",
    genre: s.genre,
    youtube_url: "",
  };
}

/** Two feedback arrays encode the same constraint (per-category state + year direction). */
function sameFeedback(a: CategoryFeedback[], b: CategoryFeedback[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].category !== b[i].category || a[i].state !== b[i].state) return false;
    if (a[i].category === "year" && a[i].direction !== b[i].direction) return false;
  }
  return true;
}

/**
 * The catalog songs still consistent with every guess so far: a song is possible
 * iff, treated as the hypothetical answer, each past guess would reproduce the
 * exact feedback the player saw. Encodes all clue constraints with no extra logic.
 */
export function remainingPossibilities(
  catalog: CatalogSong[],
  guesses: Guess[]
): CatalogSong[] {
  const played = guesses.filter((g): g is Guess & { song: CatalogSong } => !!g.song);
  if (played.length === 0) return catalog;
  const lifted = played.map((g) => ({ bolly: catalogToBollywood(g.song), fb: g.feedback }));
  return catalog.filter((cand) => {
    const target = catalogToBollywood(cand);
    return lifted.every((g) => sameFeedback(checkGuess(g.bolly, target), g.fb));
  });
}

/** Per-category distinct values among the remaining candidates, plus the count. */
export function summarizePossibilities(songs: CatalogSong[]): {
  count: number;
  byCategory: Record<CategoryKey, string[]>;
} {
  const md = new Set<string>();
  const sing = new Set<string>();
  const yr = new Set<number>();
  const mv = new Set<string>();
  const gn = new Set<string>();
  for (const s of songs) {
    if (s.music_director) md.add(s.music_director);
    for (const one of s.singers.split(",").map((x) => x.trim()).filter(Boolean)) sing.add(one);
    if (Number.isFinite(s.year)) yr.add(s.year);
    if (s.movie) mv.add(s.movie);
    if (s.genre) gn.add(s.genre);
  }
  return {
    count: songs.length,
    byCategory: {
      music_director: [...md].sort((a, b) => a.localeCompare(b)),
      singers: [...sing].sort((a, b) => a.localeCompare(b)),
      year: [...yr].sort((a, b) => a - b).map(String),
      movie: [...mv].sort((a, b) => a.localeCompare(b)),
      genre: [...gn].sort((a, b) => a.localeCompare(b)),
    },
  };
}

/** Launch day: Geetdle puzzle #1 is 2026-11-01 (there are no puzzles before it). */
export const PUZZLE_EPOCH_UTC = Date.UTC(2026, 10, 1); // 2026-11-01 UTC

/**
 * The puzzle number for a given day: 1 on launch day (2026-11-01), +1 each day
 * after. This is the shared seed for the daily puzzle — the client uses it to
 * label/share "#N", and the server uses it to seed the weighted pseudo-random
 * answer pick (lib/games/geetdle/queries.ts), so everyone gets the same song on
 * the same day. Computed from the UTC calendar date so the client and server
 * always agree on the number (puzzles roll over at 00:00 UTC). Pure (no DB),
 * safe to import on the client.
 */
export function getPuzzleNumber(date = new Date()): number {
  const d = new Date(date);
  const todayUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((todayUtc - PUZZLE_EPOCH_UTC) / 86_400_000) + 1;
}

/**
 * Generate a shareable message: a cool header, the emoji guess matrix, and
 * (optionally) a link back to Geetdle.
 */
export function generateShareText(
  guesses: Guess[],
  puzzleNumber: number,
  url?: string,
  solved = true
): string {
  const tries = guesses.length;
  const title = `🎬 Geetdle #${puzzleNumber}`;
  const result = !solved
    ? `Stumped by today's Bollywood tune 🙈`
    : tries > 0
      ? `Named that Bollywood tune in ${tries} ${tries === 1 ? "guess" : "guesses"} 🎶`
      : `Today's Bollywood song puzzle 🎶`;

  const grid = guesses
    .map((guess) =>
      guess.feedback
        .map((f) => {
          if (f.state === "exact") return "🟩";
          if (f.state === "partial" || f.state === "partial-weak") return "🟨";
          return "⬜";
        })
        .join("")
    )
    .join("\n");

  const parts = [`${title}\n${result}`, grid];
  if (url) parts.push(`Can you beat me? 👉 ${url}`);

  return parts.filter(Boolean).join("\n\n");
}

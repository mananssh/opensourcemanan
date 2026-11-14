#!/usr/bin/env node
/**
 * Seed the `geetdle_songs` table — the Geetdle game's PRIVATE catalog.
 *
 * JioSaavn is the SOLE source. The crawl JSON is gitignored (see .gitignore):
 * the catalog lives only in the DB, never in the repo. Idempotent: upserts on
 * `song_uuid`. Run AFTER the latest migration is applied.
 *
 *   node --env-file=.env scripts/seed-geetdle.mjs
 *   node --env-file=.env scripts/seed-geetdle.mjs --force           # truncate first
 *   node --env-file=.env scripts/seed-geetdle.mjs --min-plays 100000
 *
 * Inputs:
 *   --crawl <path>   JioSaavn crawl. Default: data/geetdle/jiosaavn.json
 *   --min-plays <n>  play_count floor for answer eligibility. Default: 1000000
 *   --force          TRUNCATE geetdle_songs before seeding
 *
 * Fields & eligibility:
 *   - JioSaavn has no genre, so we INFER one from the title/movie/singers.
 *   - Every JioSaavn song carries album art → `poster_url` (the poster hint).
 *   - A row is answer-eligible iff it has an (inferred) genre AND a play_count
 *     >= min-plays AND a poster — i.e. a recognizable, provably-popular song
 *     with art. Everything else stays searchable but can't be the daily answer.
 */
import { readFileSync, existsSync } from "node:fs";
import postgres from "postgres";
import { inferGenre } from "./lib/geetdle-genre.mjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set. Run: node --env-file=.env scripts/seed-geetdle.mjs");
  process.exit(1);
}

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const single = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const multi = (n) => { const o = []; for (let i = 0; i < argv.length - 1; i++) if (argv[i] === n) o.push(argv[i + 1]); return o; };

const crawlFiles = multi("--crawl");
if (crawlFiles.length === 0) {
  if (existsSync("data/geetdle/jiosaavn.json")) crawlFiles.push("data/geetdle/jiosaavn.json");
  else { console.error("No crawl file. Run scripts/crawl-jiosaavn.mjs first, or pass --crawl <path>."); process.exit(1); }
}
const MIN_PLAYS = Number(single("--min-plays", "1000000"));
const force = flag("--force");
const HINDI_ONLY = true;

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const arrayOf = (d) => (Array.isArray(d) ? d : d.songs ?? []);
const clean = (v) => (typeof v === "string" ? v.trim() : "");
const norm = (s) => clean(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const dupKey = (title, year, movie) => `${norm(title)}|${year}|${norm(movie)}`;

/** Normalize a JioSaavn crawl row to a DB row (genre inferred from the title). */
function toRow(r) {
  const songUuid = r.songUuid ?? r.song_uuid;
  const title = clean(r.title ?? r.song_title);
  const year = Number(r.year ?? r.album_year);
  if (!songUuid || !title || !Number.isFinite(year)) return null;
  const language = clean(r.language) || "Hindi";
  if (HINDI_ONLY && language.toLowerCase() !== "hindi") return null;
  const secondary = r.secondaryGenres ?? r.secondary_genres ?? [];
  const singers = clean(r.singers ?? r.song_singers);
  const movie = clean(r.movie ?? r.album_title);
  const genre = clean(r.genre) || inferGenre(title, { singers, movie });
  const pop = r.popularity ?? r.play_count;
  const popNum = Number(pop);
  return {
    song_uuid: songUuid,
    title,
    title_lower: title.toLowerCase(),
    singers,
    movie,
    year,
    music_director: clean(r.musicDirector ?? r.music_director),
    language,
    genre,
    secondary_genres: Array.isArray(secondary) ? secondary : [],
    youtube_url: clean(r.youtubeUrl ?? r.youtube_url) || null,
    poster_url: clean(r.posterUrl ?? r.poster_url) || null,
    popularity: Number.isFinite(popNum) && popNum > 0 ? Math.round(popNum) : null,
    source: clean(r.source) || "jiosaavn",
  };
}

// Load crawl rows, de-duplicating by uuid and by normalized title+year+movie.
const byUuid = new Map();
const seenKeys = new Set();
for (const f of crawlFiles) {
  const rows = arrayOf(readJson(f)).map(toRow).filter(Boolean);
  for (const r of rows) {
    const key = dupKey(r.title, r.year, r.movie);
    if (seenKeys.has(key) || byUuid.has(r.song_uuid)) continue;
    seenKeys.add(key);
    byUuid.set(r.song_uuid, r);
  }
  console.log(`Crawl: read ${rows.length} rows from ${f}`);
}

// Eligibility: inferred genre AND play_count >= threshold AND a poster.
const rows = [...byUuid.values()];
for (const r of rows) {
  r.is_answer_eligible =
    r.genre != null &&
    r.popularity != null &&
    r.popularity >= MIN_PLAYS &&
    !!r.poster_url;
}
const eligible = rows.filter((r) => r.is_answer_eligible);
console.log(
  `Prepared ${rows.length} rows; ${eligible.length} answer-eligible ` +
    `(genre + poster + play_count >= ${MIN_PLAYS}) — ` +
    `${eligible.filter((r) => r.year >= 2000).length} post-2000 / ` +
    `${eligible.filter((r) => r.year < 2000).length} pre-2000.`,
);

const COLS = [
  "song_uuid", "title", "title_lower", "singers", "movie", "year",
  "music_director", "language", "genre", "secondary_genres", "youtube_url",
  "poster_url", "popularity", "is_answer_eligible", "source",
];

const sql = postgres(url, { max: 1 });
try {
  if (force) { await sql`TRUNCATE TABLE geetdle_songs`; console.log("Truncated."); }
  const BATCH = 500;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await sql`
      INSERT INTO geetdle_songs ${sql(batch, ...COLS)}
      ON CONFLICT (song_uuid) DO UPDATE SET
        title = excluded.title, title_lower = excluded.title_lower,
        singers = excluded.singers, movie = excluded.movie, year = excluded.year,
        music_director = excluded.music_director, language = excluded.language,
        genre = excluded.genre, secondary_genres = excluded.secondary_genres,
        youtube_url = excluded.youtube_url, poster_url = excluded.poster_url,
        popularity = excluded.popularity,
        is_answer_eligible = excluded.is_answer_eligible, source = excluded.source
    `;
    done += batch.length;
    if (done % 10000 === 0 || done === rows.length) console.log(`  upserted ${done}/${rows.length}`);
  }
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM geetdle_songs`;
  console.log(`Done. geetdle_songs now has ${count} rows.`);
} finally {
  await sql.end();
}

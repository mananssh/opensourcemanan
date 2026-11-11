#!/usr/bin/env node
/**
 * Seed the `geetdle_songs` table — the Geetdle game's PRIVATE catalog.
 *
 * Source JSONs are gitignored (see .gitignore): the catalog lives only in the
 * DB, never in the repo. Idempotent: upserts on `song_uuid`. Run AFTER the
 * 0019 migration is applied.
 *
 *   node --env-file=.env scripts/seed-geetdle.mjs
 *   node --env-file=.env scripts/seed-geetdle.mjs --force           # truncate first
 *   node --env-file=.env scripts/seed-geetdle.mjs --min-plays 100000
 *
 * Inputs:
 *   --file <path>    BASE catalog (MrAsacker, has genre). Default: bollywood-dataset-tagged-v2.json
 *   --crawl <path>   JioSaavn crawl (has play_count, no genre). Default: data/geetdle/jiosaavn.json
 *   --min-plays <n>  play_count floor for answer eligibility. Default: 50000
 *   --force          TRUNCATE geetdle_songs before seeding
 *
 * How popularity + eligibility work (the two sources are complementary):
 *   - The base has genre but no popularity; JioSaavn has popularity but no genre.
 *   - We MERGE each crawled song's play_count onto the matching base row (by
 *     normalized title+year+movie), so well-known songs gain a real popularity.
 *   - JioSaavn-only songs (no base match) are inserted as extra SEARCHABLE
 *     guesses (genre null, so never answers).
 *   - A row is answer-eligible iff it has a genre AND a play_count >= min-plays
 *     — i.e. a recognizable, genre-tagged, provably-popular song. Everything
 *     else stays searchable but can't be the daily answer.
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

const baseFiles = multi("--file");
if (baseFiles.length === 0) baseFiles.push("bollywood-dataset-tagged-v2.json");
const crawlFiles = multi("--crawl");
if (crawlFiles.length === 0 && existsSync("data/geetdle/jiosaavn.json")) {
  crawlFiles.push("data/geetdle/jiosaavn.json");
}
const MIN_PLAYS = Number(single("--min-plays", "1000000"));
const force = flag("--force");
const HINDI_ONLY = true;

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const arrayOf = (d) => (Array.isArray(d) ? d : d.songs ?? []);
const clean = (v) => (typeof v === "string" ? v.trim() : "");
const norm = (s) => clean(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const dupKey = (title, year, movie) => `${norm(title)}|${year}|${norm(movie)}`;

/** Normalize either input shape to a row (genre/popularity may be null). */
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
  // Base rows carry a genre; crawled (JioSaavn) rows don't — infer one from the
  // title/movie/singers so every song has a sensible genre clue.
  const genre = clean(r.genre) || inferGenre(title, { singers, movie });
  const pop = r.popularity ?? r.song_rating ?? r.play_count;
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
    popularity: Number.isFinite(popNum) && popNum > 0 ? Math.round(popNum) : null,
    source: clean(r.source) || "mrasacker",
  };
}

// 1) Load the crawl: popularity by normalized key, plus the crawl rows themselves.
const popByKey = new Map();
const crawlRows = [];
for (const f of crawlFiles) {
  const rows = arrayOf(readJson(f)).map(toRow).filter(Boolean);
  for (const r of rows) {
    crawlRows.push(r);
    if (r.popularity != null) {
      const k = dupKey(r.title, r.year, r.movie);
      popByKey.set(k, Math.max(popByKey.get(k) ?? 0, r.popularity));
    }
  }
  console.log(`Crawl: read ${rows.length} rows from ${f}`);
}

// 2) Load base rows, merging crawled popularity onto matches.
const byUuid = new Map();
const seenKeys = new Set();
let merged = 0;
for (const f of baseFiles) {
  const rows = arrayOf(readJson(f)).map(toRow).filter(Boolean);
  for (const r of rows) {
    const key = dupKey(r.title, r.year, r.movie);
    if (seenKeys.has(key) || byUuid.has(r.song_uuid)) continue;
    const crawledPop = popByKey.get(key);
    if (crawledPop != null) { r.popularity = crawledPop; merged++; }
    seenKeys.add(key);
    byUuid.set(r.song_uuid, r);
  }
  console.log(`Base: read ${rows.length} rows from ${f}`);
}
console.log(`Merged play_count onto ${merged} base rows.`);

// 3) Add JioSaavn-only songs (no base match) as searchable guesses.
let added = 0;
for (const r of crawlRows) {
  const key = dupKey(r.title, r.year, r.movie);
  if (seenKeys.has(key) || byUuid.has(r.song_uuid)) continue;
  seenKeys.add(key);
  byUuid.set(r.song_uuid, r);
  added++;
}
console.log(`Added ${added} JioSaavn-only searchable songs.`);

// 4) Eligibility: genre present AND play_count >= threshold.
const rows = [...byUuid.values()];
for (const r of rows) {
  r.is_answer_eligible = r.genre != null && r.popularity != null && r.popularity >= MIN_PLAYS;
}
const eligible = rows.filter((r) => r.is_answer_eligible);
console.log(
  `Prepared ${rows.length} rows; ${eligible.length} answer-eligible ` +
    `(genre + play_count >= ${MIN_PLAYS}) — ` +
    `${eligible.filter((r) => r.year >= 2000).length} post-2000 / ` +
    `${eligible.filter((r) => r.year < 2000).length} pre-2000.`,
);

const COLS = [
  "song_uuid", "title", "title_lower", "singers", "movie", "year",
  "music_director", "language", "genre", "secondary_genres", "youtube_url",
  "popularity", "is_answer_eligible", "source",
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
        youtube_url = excluded.youtube_url, popularity = excluded.popularity,
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

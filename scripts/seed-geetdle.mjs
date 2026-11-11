#!/usr/bin/env node
/**
 * Seed the `geetdle_songs` table — the Geetdle game's PRIVATE catalog.
 *
 * The source JSON files are gitignored (see .gitignore): the catalog lives only
 * in the DB, never in the repo. Idempotent: upserts on `song_uuid`, so re-runs
 * refresh rows without duplicating. Run AFTER the 0019 migration is applied.
 *
 *   node --env-file=.env scripts/seed-geetdle.mjs
 *   node --env-file=.env scripts/seed-geetdle.mjs --force            # truncate first
 *   node --env-file=.env scripts/seed-geetdle.mjs --file data/geetdle/jiosaavn.json
 *
 * Inputs (defaults):
 *   --file <path>      source file(s), repeatable. Default: bollywood-dataset-tagged-v2.json
 *   --eligible <path>  uuids that may be daily ANSWERS. Default: bollywood-top-1000.json
 *   --all-eligible     mark every seeded row answer-eligible (ignore --eligible)
 *   --force            TRUNCATE geetdle_songs before seeding
 *
 * Two input shapes are accepted and normalized:
 *   - tagged-v2:  { songs: [{ song_uuid, song_title, song_singers, album_title,
 *                   album_year, music_director, youtube_url, song_rating,
 *                   language, genre, secondary_genres }] }
 *   - pre-mapped: [{ songUuid, title, singers, movie, year, musicDirector,
 *                   language, genre, secondaryGenres, youtubeUrl, popularity,
 *                   source }]   (e.g. the JioSaavn crawler output)
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL not set. Run: node --env-file=.env scripts/seed-geetdle.mjs",
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const multi = (name) => {
  const out = [];
  for (let i = 0; i < argv.length - 1; i++) if (argv[i] === name) out.push(argv[i + 1]);
  return out;
};
const single = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};

const files = multi("--file");
if (files.length === 0) files.push("bollywood-dataset-tagged-v2.json");
const eligibleFile = single("--eligible", "bollywood-top-1000.json");
const allEligible = flag("--all-eligible");
const force = flag("--force");
const HINDI_ONLY = true; // per product decision: Hindi catalog only, for now

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const arrayOf = (data) => (Array.isArray(data) ? data : data.songs ?? []);
const clean = (v) => (typeof v === "string" ? v.trim() : "");

/** Build the eligibility set (uuids allowed to be daily answers). */
let eligibleSet = null;
if (!allEligible) {
  try {
    const rows = arrayOf(readJson(eligibleFile));
    eligibleSet = new Set(rows.map((r) => r.song_uuid ?? r.songUuid).filter(Boolean));
    console.log(`Eligibility: ${eligibleSet.size} uuids from ${eligibleFile}`);
  } catch {
    console.warn(
      `Could not read ${eligibleFile}; marking ALL seeded rows answer-eligible.`,
    );
  }
}

/** Normalize either input shape into a geetdle_songs row. */
function toRow(r) {
  const songUuid = r.songUuid ?? r.song_uuid;
  const title = clean(r.title ?? r.song_title);
  const year = Number(r.year ?? r.album_year);
  if (!songUuid || !title || !Number.isFinite(year)) return null;

  const language = clean(r.language) || "Hindi";
  if (HINDI_ONLY && language.toLowerCase() !== "hindi") return null;

  const secondary = r.secondaryGenres ?? r.secondary_genres ?? [];
  const rating = Number(r.popularity ?? r.song_rating ?? 0);

  return {
    song_uuid: songUuid,
    title,
    title_lower: title.toLowerCase(),
    singers: clean(r.singers ?? r.song_singers),
    movie: clean(r.movie ?? r.album_title),
    year,
    music_director: clean(r.musicDirector ?? r.music_director),
    language,
    genre: clean(r.genre) || null,
    secondary_genres: Array.isArray(secondary) ? secondary : [],
    youtube_url: clean(r.youtubeUrl ?? r.youtube_url) || null,
    popularity: rating > 0 ? Math.round(rating) : null,
    is_answer_eligible: allEligible || !eligibleSet || eligibleSet.has(songUuid),
    source: clean(r.source) || "mrasacker",
  };
}

// Collect + dedupe across all input files (first occurrence wins). Dedupe both
// by song_uuid AND by a normalized title+year+movie key, so the same song
// crawled from a second source (e.g. JioSaavn) doesn't create a duplicate row.
// Process base files before crawled ones so the base record wins.
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const dupKey = (r) => `${norm(r.title)}|${r.year}|${norm(r.movie)}`;
const byUuid = new Map();
const seenKeys = new Set();
let read = 0;
for (const f of files) {
  const rows = arrayOf(readJson(f));
  read += rows.length;
  for (const raw of rows) {
    const row = toRow(raw);
    if (!row) continue;
    if (byUuid.has(row.song_uuid)) continue;
    const key = dupKey(row);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    byUuid.set(row.song_uuid, row);
  }
  console.log(`Read ${rows.length} from ${f}`);
}
const rows = [...byUuid.values()];
const eligibleCount = rows.filter((r) => r.is_answer_eligible).length;
console.log(
  `Prepared ${rows.length} rows (${eligibleCount} answer-eligible) from ${read} read.`,
);

const COLS = [
  "song_uuid", "title", "title_lower", "singers", "movie", "year",
  "music_director", "language", "genre", "secondary_genres", "youtube_url",
  "popularity", "is_answer_eligible", "source",
];

const sql = postgres(url, { max: 1 });
try {
  if (force) {
    await sql`TRUNCATE TABLE geetdle_songs`;
    console.log("Truncated geetdle_songs.");
  }
  const BATCH = 500;
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await sql`
      INSERT INTO geetdle_songs ${sql(batch, ...COLS)}
      ON CONFLICT (song_uuid) DO UPDATE SET
        title = excluded.title,
        title_lower = excluded.title_lower,
        singers = excluded.singers,
        movie = excluded.movie,
        year = excluded.year,
        music_director = excluded.music_director,
        language = excluded.language,
        genre = excluded.genre,
        secondary_genres = excluded.secondary_genres,
        youtube_url = excluded.youtube_url,
        popularity = excluded.popularity,
        is_answer_eligible = excluded.is_answer_eligible,
        source = excluded.source
    `;
    done += batch.length;
    if (done % 5000 === 0 || done === rows.length) {
      console.log(`  upserted ${done}/${rows.length}`);
    }
  }
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM geetdle_songs`;
  console.log(`Done. geetdle_songs now has ${count} rows.`);
} finally {
  await sql.end();
}

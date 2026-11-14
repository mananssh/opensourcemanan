#!/usr/bin/env node
/**
 * Targeted JioSaavn crawler — grows the Geetdle catalog with popular Hindi
 * Bollywood songs and (crucially) their play counts.
 *
 * JioSaavn is the SOLE catalog source: it gives title, year, language, play
 * count, album/movie, music director, singers, and album art (the poster hint).
 * It has no genre, so `seed-geetdle.mjs` infers one from the title. Output is
 * gitignored — nothing ships in the repo; the catalog lives only in the DB.
 *
 *   node --openssl-legacy-provider scripts/crawl-jiosaavn.mjs            # full crawl (DES audio decrypt needs the flag)
 *   node --openssl-legacy-provider scripts/crawl-jiosaavn.mjs --cap 500  # stop after 500 unique (validation)
 *   node --openssl-legacy-provider scripts/crawl-jiosaavn.mjs --out data/geetdle/jiosaavn.json
 *
 * Uses the public JioSaavn web API (no auth). Polite: one request at a time
 * with a delay, retries on transient failure. Hindi-only.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createDecipheriv } from "node:crypto";

/**
 * JioSaavn ships the stream URL DES-ECB-encrypted in `encrypted_media_url`.
 * Decrypt it (public key "38346591") to a direct CDN URL, then pick a bitrate.
 * DES lives in OpenSSL's legacy provider, so this script must run with
 * `node --openssl-legacy-provider`. If it can't decrypt (flag missing), we warn
 * once and leave audio null rather than crashing the whole crawl.
 */
let warnedDecrypt = false;
const decryptAudio = (enc) => {
  if (!enc) return null;
  try {
    const d = createDecipheriv("des-ecb", Buffer.from("38346591", "utf8"), null);
    d.setAutoPadding(true);
    const url = d.update(enc, "base64", "utf8") + d.final("utf8");
    // Prefer 160kbps; the decrypted URL defaults to _96.mp4.
    return url.replace(/_\d+\.mp4$/, "_160.mp4");
  } catch (e) {
    if (!warnedDecrypt) {
      warnedDecrypt = true;
      console.warn(
        `  ! audio decrypt unavailable (${e.message}). Re-run with: node --openssl-legacy-provider scripts/crawl-jiosaavn.mjs`,
      );
    }
    return null;
  }
};

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const OUT = arg("--out", "data/geetdle/jiosaavn.json");
const GLOBAL_CAP = Number(arg("--cap", "6000"));
const PAGES_PER_QUERY = Number(arg("--pages", "5"));
const PER_PAGE = Number(arg("--n", "50"));
const DELAY_MS = Number(arg("--delay", "250"));
const UA = "GeetdleDatasetBot/1.0 (dataset research; non-commercial)";

// Popular Bollywood playback artists + music directors — high-signal seeds.
const QUERIES = [
  // Singers
  "Arijit Singh", "Lata Mangeshkar", "Kishore Kumar", "Mohammed Rafi",
  "Asha Bhosle", "Shreya Ghoshal", "Sonu Nigam", "Udit Narayan",
  "Alka Yagnik", "Kumar Sanu", "Mukesh", "Sunidhi Chauhan", "Atif Aslam",
  "KK", "Neha Kakkar", "Armaan Malik", "Jubin Nautiyal", "Shaan",
  "Mohit Chauhan", "Rahat Fateh Ali Khan", "Shankar Mahadevan",
  "Vishal Dadlani", "Darshan Raval", "B Praak", "Honey Singh", "Badshah",
  "Ankit Tiwari", "Palak Muchhal", "Tulsi Kumar", "Kanika Kapoor",
  "Lucky Ali", "Abhijeet", "Kavita Krishnamurthy", "Hariharan",
  // Music directors
  "A.R. Rahman", "R.D. Burman", "S.D. Burman", "Laxmikant-Pyarelal",
  "Kalyanji-Anandji", "Shankar-Jaikishan", "Pritam", "Vishal-Shekhar",
  "Shankar-Ehsaan-Loy", "Amit Trivedi", "Sachin-Jigar", "Nadeem-Shravan",
  "Anu Malik", "Bappi Lahiri", "Madan Mohan", "O.P. Nayyar", "Jatin-Lalit",
  "Himesh Reshammiya", "Salim-Sulaiman", "Tanishk Bagchi", "Mithoon",
];

// Minimal HTML-entity decode for JioSaavn's encoded strings.
const ENT = { "&amp;": "&", "&quot;": '"', "&#039;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " " };
const decode = (s) =>
  typeof s === "string"
    ? s.replace(/&(amp|quot|#039|apos|lt|gt|nbsp);/g, (m) => ENT[m] ?? m).trim()
    : "";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(query, page) {
  const url =
    `https://www.jiosaavn.com/api.php?__call=search.getResults` +
    `&q=${encodeURIComponent(query)}&_format=json&_marker=0&api_version=4` +
    `&ctx=web6dot0&n=${PER_PAGE}&p=${page}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return Array.isArray(json.results) ? json.results : [];
    } catch (err) {
      if (attempt === 3) {
        console.warn(`  ! ${query} p${page}: ${err.message}`);
        return [];
      }
      await sleep(DELAY_MS * attempt * 2);
    }
  }
  return [];
}

// JioSaavn image URLs embed a size token (…-150x150.jpg). Bump it to 500x500
// for a usable poster; the CDN serves that variant from the same path.
const posterUrl = (img) => {
  const u = decode(img);
  return u ? u.replace(/\d+x\d+(?=\.\w+$)/, "500x500") : null;
};

function mapSong(r) {
  if (!r || r.type !== "song") return null;
  const language = decode(r.language).toLowerCase();
  if (language !== "hindi") return null;
  const year = parseInt(r.year, 10);
  if (!Number.isFinite(year)) return null;
  const title = decode(r.title);
  if (!title) return null;
  const mi = r.more_info ?? {};
  const singers = (mi.artistMap?.primary_artists ?? [])
    .map((a) => decode(a.name))
    .filter(Boolean)
    .join(", ");
  const playCount = parseInt(r.play_count, 10);

  return {
    songUuid: `jiosaavn-${r.id}`,
    title,
    singers,
    movie: decode(mi.album),
    year,
    musicDirector: decode(mi.music),
    language: "Hindi",
    genre: null, // JioSaavn has no genre — inferred at seed time from the title.
    secondaryGenres: [],
    youtubeUrl: null,
    posterUrl: posterUrl(r.image), // album/song art — the poster hint source.
    audioUrl: decryptAudio(mi.encrypted_media_url), // decrypted stream — audio hint.
    permaUrl: decode(r.perma_url) || null,
    popularity: Number.isFinite(playCount) ? playCount : null,
    source: "jiosaavn",
  };
}

const byId = new Map();
let requests = 0;

outer: for (const query of QUERIES) {
  let added = 0;
  for (let p = 1; p <= PAGES_PER_QUERY; p++) {
    const results = await fetchPage(query, p);
    requests++;
    if (results.length === 0) break; // no more pages for this query
    for (const raw of results) {
      const song = mapSong(raw);
      if (song && !byId.has(song.songUuid)) {
        byId.set(song.songUuid, song);
        added++;
      }
    }
    await sleep(DELAY_MS);
    if (byId.size >= GLOBAL_CAP) {
      console.log(`Reached cap ${GLOBAL_CAP}.`);
      break outer;
    }
  }
  console.log(`  ${query}: +${added} (total ${byId.size})`);
}

const rows = [...byId.values()];
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(rows, null, 0));
const withPlays = rows.filter((r) => r.popularity != null).length;
const withAudio = rows.filter((r) => r.audioUrl != null).length;
const withPoster = rows.filter((r) => r.posterUrl != null).length;
console.log(
  `\nCrawled ${rows.length} unique Hindi songs (${withPlays} with play_count, ` +
    `${withPoster} with poster, ${withAudio} with audio) in ${requests} requests → ${OUT}`,
);

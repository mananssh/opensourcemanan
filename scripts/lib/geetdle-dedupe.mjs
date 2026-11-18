/**
 * Geetdle catalog de-duplication — one song, kept once.
 *
 * JioSaavn re-lists the same recording under dozens of "playlist" albums
 * (`Best of 2025`, `Valentines Special`, `Arijit Singh Drive Mix`, …), each a
 * separate row with its own `song_uuid`, a compilation name in `movie`, and a
 * fresh `year` stamp. The seed's old `title|year|movie` de-dupe couldn't catch
 * them because movie and year differ on every copy.
 *
 * This collapses them by the thing that is actually stable — the song itself:
 * its title and its set of singers (order-independent). Within a duplicate
 * group we keep the ORIGINAL — the oldest release — breaking ties toward the
 * row that looks like a real soundtrack rather than a compilation.
 *
 * Pure and dependency-free so it can run in the seed pipeline and in a
 * one-off DB prune against identical rules.
 */

/** Order-independent singer-set key: lowercased, split, trimmed, sorted. */
export function normArtists(singers) {
  return (singers || "")
    .toLowerCase()
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .sort()
    .join("|");
}

/**
 * Title key: lowercased, whitespace-collapsed, with a trailing JioSaavn
 * `(From "Movie")` / `(From Movie)` suffix stripped — so `Gehra Hua
 * (From "Dhurandhar")` and `Gehra Hua` collapse together.
 */
export function normTitle(title) {
  return (title || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*\(from\s.*?\)\s*$/i, "")
    .trim();
}

/** The grouping key two rows share iff they are the same song. */
export function songKey(row) {
  return `${normTitle(row.title)}::${normArtists(row.singers)}`;
}

const year = (r) => (Number.isFinite(Number(r.year)) ? Number(r.year) : 9999);
const pop = (r) => (Number.isFinite(Number(r.popularity)) ? Number(r.popularity) : 0);
const uid = (r) => String(r.songUuid ?? r.song_uuid ?? "");

/**
 * Split rows into keepers and losers.
 *
 * Keeper per group: oldest `year` → then the row on the smallest `movie`
 * bucket (a real OST holds a handful of songs; a playlist aggregates many) →
 * then highest `popularity` → then lowest `songUuid`, so the choice is fully
 * deterministic and stable across runs.
 *
 * @param {Array<object>} rows  Rows with { songUuid|song_uuid, title, singers, year, movie, popularity }.
 * @returns {{ keepers: object[], losers: object[], groups: number, duplicated: number }}
 */
export function dedupeSongs(rows) {
  const movieSize = new Map();
  for (const r of rows) {
    const m = r.movie ?? "";
    movieSize.set(m, (movieSize.get(m) ?? 0) + 1);
  }
  const bucket = (r) => movieSize.get(r.movie ?? "") ?? 1;

  const groups = new Map();
  for (const r of rows) {
    const k = songKey(r);
    const g = groups.get(k);
    if (g) g.push(r);
    else groups.set(k, [r]);
  }

  const better = (a, b) => {
    if (year(a) !== year(b)) return year(a) - year(b);
    if (bucket(a) !== bucket(b)) return bucket(a) - bucket(b);
    if (pop(a) !== pop(b)) return pop(b) - pop(a);
    return uid(a) < uid(b) ? -1 : 1;
  };

  const keepers = [];
  const losers = [];
  let duplicated = 0;
  for (const group of groups.values()) {
    if (group.length === 1) {
      keepers.push(group[0]);
      continue;
    }
    duplicated++;
    const sorted = [...group].sort(better);
    keepers.push(sorted[0]);
    for (const r of sorted.slice(1)) losers.push(r);
  }

  return { keepers, losers, groups: groups.size, duplicated };
}

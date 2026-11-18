#!/usr/bin/env node
/**
 * Prune duplicate songs from the live `geetdle_songs` catalog.
 *
 * JioSaavn re-lists one recording under many "playlist" albums — the same song
 * appears dozens of times with different `song_uuid`, `movie` and `year`. This
 * collapses each song (title + singer-set, order-independent) to a single row,
 * keeping the ORIGINAL (oldest release); see scripts/lib/geetdle-dedupe.mjs for
 * the exact rule. The losers are deleted.
 *
 *   node --env-file=.env scripts/prune-geetdle-dupes.mjs            # dry run (default)
 *   node --env-file=.env scripts/prune-geetdle-dupes.mjs --apply    # actually delete
 *   node --env-file=.env scripts/prune-geetdle-dupes.mjs --apply --out losers.json
 *
 * Dry run prints the counts and a sample and changes nothing. --apply deletes
 * the losing rows in batches inside a single transaction. Idempotent: a second
 * run finds nothing to prune.
 */
import { writeFileSync } from "node:fs";
import postgres from "postgres";
import { dedupeSongs } from "./lib/geetdle-dedupe.mjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set. Run: node --env-file=.env scripts/prune-geetdle-dupes.mjs");
  process.exit(1);
}
const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const outIdx = argv.indexOf("--out");
const outFile = outIdx >= 0 ? argv[outIdx + 1] : null;

const sql = postgres(url, { max: 1 });
try {
  const rows = await sql`
    SELECT song_uuid AS "songUuid", title, singers, year, movie, popularity
    FROM geetdle_songs
  `;
  console.log(`Loaded ${rows.length} rows from geetdle_songs.`);

  const { keepers, losers, groups, duplicated } = dedupeSongs(rows);
  console.log(
    `\nDistinct songs:      ${groups}\n` +
      `Songs duplicated:    ${duplicated}\n` +
      `Rows to keep:        ${keepers.length}\n` +
      `Rows to delete:      ${losers.length}\n` +
      `After prune:         ${rows.length - losers.length}`,
  );

  if (losers.length === 0) {
    console.log("\nNothing to prune — catalog already de-duplicated.");
  } else {
    console.log("\nSample of rows to delete (first 15):");
    for (const r of losers.slice(0, 15)) {
      console.log(`  cut y=${r.year} "${r.title}" — ${r.movie} [${r.songUuid}]`);
    }
  }

  if (outFile) {
    writeFileSync(
      outFile,
      JSON.stringify(losers.map((r) => ({ ...r })), null, 2),
    );
    console.log(`\nWrote ${losers.length} loser rows to ${outFile}`);
  }

  if (!apply) {
    console.log("\nDRY RUN — nothing deleted. Re-run with --apply to delete.");
  } else if (losers.length > 0) {
    const ids = losers.map((r) => r.songUuid);
    const BATCH = 500;
    let deleted = 0;
    await sql.begin(async (tx) => {
      for (let i = 0; i < ids.length; i += BATCH) {
        const chunk = ids.slice(i, i + BATCH);
        const res = await tx`DELETE FROM geetdle_songs WHERE song_uuid IN ${tx(chunk)}`;
        deleted += res.count;
      }
    });
    const [{ c }] = await sql`SELECT count(*)::int AS c FROM geetdle_songs`;
    console.log(`\nDeleted ${deleted} rows. geetdle_songs now has ${c} rows.`);
  }
} finally {
  await sql.end();
}

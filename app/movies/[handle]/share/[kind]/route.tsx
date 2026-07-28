import { ImageResponse } from "next/og";
import { getPublicProfile } from "@/lib/movies/queries";
import { computeStats } from "@/lib/movies/stats";
import { formatHours } from "@/lib/movies/format";

// Shareable cards (Instagram story / square) rendered as ticket stubs. Reads the
// public profile from the DB, so it runs on the Node runtime (postgres.js).
export const runtime = "nodejs";

const SIZES = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;

type Kind = keyof typeof SIZES;

// Palette pulled from the .vertical-movies light tokens (kraft + ticket red).
const KRAFT = "#e8dabd";
const CARD = "#f2e8d1";
const INK = "#1c1610";
const MUTED = "#4a3f2a";
const RED = "#9d1e13";
const RULE = "#cdba8d";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string; kind: string }> },
) {
  const { handle, kind: kindParam } = await params;
  const kind: Kind = kindParam === "square" ? "square" : "story";
  const size = SIZES[kind];

  const profile = await getPublicProfile(handle);
  if (!profile) {
    return new Response("Not found", { status: 404 });
  }

  const stats = computeStats(profile.entries);
  const name = profile.watcher.displayName ?? `@${profile.watcher.handle}`;
  const posters = profile.entries
    .filter((e) => e.posterUrl)
    .slice(0, kind === "story" ? 6 : 4);
  const topGenre = stats.topGenres[0]?.genre ?? null;
  const isStory = kind === "story";

  const posterW = isStory ? 300 : 220;
  const posterH = Math.round(posterW * 1.5);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: KRAFT,
          color: INK,
          padding: isStory ? 80 : 64,
          fontFamily: "sans-serif",
        }}
      >
        {/* Sprocket rail top */}
        <div style={{ display: "flex", gap: 14, marginBottom: 40 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{ width: 26, height: 18, borderRadius: 4, background: RULE }}
            />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              letterSpacing: 12,
              color: RED,
              fontWeight: 700,
            }}
          >
            ADMIT ONE · REEL
          </div>
          <div
            style={{
              display: "flex",
              fontSize: isStory ? 120 : 96,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1,
              marginTop: 12,
            }}
          >
            {name}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: MUTED, marginTop: 8 }}>
            @{profile.watcher.handle}
          </div>

          {/* Poster collage */}
          <div style={{ display: "flex", gap: 20, marginTop: 56, flexWrap: "wrap" }}>
            {posters.map((e) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={e.id}
                alt=""
                src={e.posterUrl!}
                width={posterW}
                height={posterH}
                style={{
                  width: posterW,
                  height: posterH,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: `3px solid ${INK}`,
                }}
              />
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Perforated divider */}
          <div
            style={{
              display: "flex",
              borderTop: `3px dashed ${RULE}`,
              marginTop: 48,
              paddingTop: 40,
              gap: isStory ? 72 : 48,
            }}
          >
            <Stat value={String(stats.totalTitles)} label="TITLES" />
            <Stat value={formatHours(stats.totalMinutes)} label="WATCHED" />
            {stats.avgStars != null && (
              <Stat value={`${stats.avgStars.toFixed(1)}★`} label="AVG" />
            )}
            {topGenre && <Stat value={topGenre} label="TOP GENRE" />}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 40,
            fontSize: 24,
            color: MUTED,
            letterSpacing: 4,
          }}
        >
          <span>№ {String(stats.totalTitles).padStart(4, "0")}</span>
          <span>REEL · A MOVIE LOGBOOK</span>
        </div>

        {/* Card sheen strip */}
        <div style={{ display: "flex", height: 8, background: CARD, marginTop: 20 }} />
      </div>
    ),
    { ...size },
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ display: "flex", fontSize: 64, fontWeight: 800, color: RED }}>{value}</span>
      <span style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: MUTED, marginTop: 6 }}>
        {label}
      </span>
    </div>
  );
}

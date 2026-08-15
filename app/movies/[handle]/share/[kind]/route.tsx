import { ImageResponse } from "next/og";
import { getPublicProfile } from "@/lib/movies/queries";
import { computeStats } from "@/lib/movies/stats";
import { formatHours } from "@/lib/movies/format";

// Shareable cards (Instagram story / square) — Last Showing lot card.
export const runtime = "nodejs";

const SIZES = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;

type Kind = keyof typeof SIZES;

// Last Showing dark palette (mirrors .vertical-movies dark tokens). OG images
// can't read CSS vars, so these are inlined intentionally.
const BG = "#0c0b09";
const PANEL = "#171512";
const INK = "#f3ece3";
const MUTED = "#b8ad9c";
const MAGENTA = "#ffb020";
const CYAN = "#7eb8d4";
const RULE = "#2a2620";

/** A drawn star (avoids relying on the ★ glyph, which satori's default font lacks). */
function Star({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={CYAN}>
      <path d="M12 2.5l2.9 6.06 6.6.79-4.87 4.53 1.29 6.52L12 17.98 6 20.4l1.3-6.52L2.4 9.35l6.6-.79L12 2.5z" />
    </svg>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string; kind: string }> },
) {
  const { handle, kind: kindParam } = await params;
  const kind: Kind = kindParam === "square" ? "square" : "story";
  const size = SIZES[kind];
  const isStory = kind === "story";

  const profile = await getPublicProfile(handle);
  if (!profile) return new Response("Not found", { status: 404 });

  const stats = computeStats(profile.entries);
  const rawName = profile.watcher.displayName ?? `@${profile.watcher.handle}`;
  const name = truncate(rawName, isStory ? 16 : 13);
  const posters = profile.entries
    .filter((e) => e.posterUrl)
    .slice(0, isStory ? 4 : 3);
  const topGenre = stats.topGenres[0]?.genre ?? null;

  const posterW = isStory ? 300 : 240;
  const posterH = Math.round(posterW * 1.5);
  const nameSize = isStory ? 128 : 104;

  const stat = (value: string, label: string, withStar = false) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {withStar && <Star size={isStory ? 44 : 36} />}
        <span style={{ display: "flex", fontSize: isStory ? 64 : 52, fontWeight: 800, color: MAGENTA }}>
          {value}
        </span>
      </div>
      <span style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: MUTED }}>{label}</span>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          color: INK,
          padding: isStory ? 84 : 64,
          fontFamily: "sans-serif",
        }}
      >
        {/* scanline wash */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", fontSize: 30, letterSpacing: 10, color: CYAN, fontWeight: 700 }}>
            ● REC · REEL
          </span>
          <span style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: MUTED }}>SP · EP</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              fontSize: nameSize,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1,
              color: INK,
              maxWidth: size.width - (isStory ? 168 : 128),
            }}
          >
            {name}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: MAGENTA, marginTop: 14, letterSpacing: 2 }}>
            @{truncate(profile.watcher.handle, 24)}
          </div>

          {posters.length > 0 && (
            <div style={{ display: "flex", gap: 18, marginTop: 52 }}>
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
                    borderRadius: 6,
                    border: `3px solid ${CYAN}`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: isStory ? 64 : 44,
            flexWrap: "wrap",
            borderTop: `2px solid ${RULE}`,
            paddingTop: 40,
            background: PANEL,
            padding: 36,
            borderRadius: 10,
          }}
        >
          {stat(String(stats.totalTitles), "TITLES")}
          {stat(formatHours(stats.totalMinutes).replace(" hrs", "H").replace(" hr", "H"), "WATCHED")}
          {stats.avgStars != null && stat(stats.avgStars.toFixed(1), "AVG", true)}
          {topGenre && stat(truncate(topGenre, 10), "TOP GENRE")}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 28,
            fontSize: 24,
            color: MUTED,
            letterSpacing: 4,
          }}
        >
          <span style={{ display: "flex" }}>№ {String(stats.totalTitles).padStart(4, "0")}</span>
          <span style={{ display: "flex" }}>REEL · A MOVIE LOGBOOK</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

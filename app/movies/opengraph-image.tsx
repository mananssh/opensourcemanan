import { ImageResponse } from "next/og";

export const alt = "Reel — last showing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default OG card for Reel — Last Showing (asphalt + sodium). */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0c0b09",
          color: "#f3ece3",
          padding: "88px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 8,
            color: "#7eb8d4",
            fontWeight: 700,
          }}
        >
          LAST SHOWING
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 140,
            fontWeight: 800,
            letterSpacing: -2,
            lineHeight: 0.85,
            textTransform: "uppercase",
          }}
        >
          Reel
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#b8ad9c" }}>
          Everything you watch, logged on the lot.
        </div>
      </div>
    ),
    { ...size },
  );
}

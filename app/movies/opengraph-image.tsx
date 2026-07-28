import { ImageResponse } from "next/og";

export const alt = "Reel — track everything you watch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default OG card for the Reel vertical (35mm & ticket-stub aesthetic). */
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
          background: "#e8dabd",
          color: "#1c1610",
          padding: "88px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 10,
            color: "#9d1e13",
            fontWeight: 700,
          }}
        >
          ▐▪▐ ADMIT ONE
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 128,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 0.9,
          }}
        >
          Reel<span style={{ color: "#9d1e13" }}>.</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#4a3f2a" }}>
          A retro logbook for everything you watch.
        </div>
      </div>
    ),
    { ...size },
  );
}

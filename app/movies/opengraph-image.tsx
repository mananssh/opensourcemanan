import { ImageResponse } from "next/og";

export const alt = "Reel — track everything you watch";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default OG card for the Reel vertical (VHS aesthetic). */
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
          background: "#0b0713",
          color: "#f3ecff",
          padding: "88px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 10,
            color: "#22e3e3",
            fontWeight: 700,
          }}
        >
          ● REC · REEL
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 132,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 0.9,
          }}
        >
          Reel<span style={{ color: "#ff3d8b" }}>.</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#baa9dc" }}>
          A VHS logbook for everything you watch.
        </div>
      </div>
    ),
    { ...size },
  );
}

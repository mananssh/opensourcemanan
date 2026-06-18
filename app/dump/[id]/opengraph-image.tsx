import { ImageResponse } from "next/og";

// Thoughts are login-gated, so the card carries NO note content — just brand.
export const alt = "Thought Dump · OSM";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          background: "#0f1626",
          padding: "88px",
          color: "#eef2fb",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 8,
            color: "#5b8cff",
            fontWeight: 700,
          }}
        >
          OSM — THOUGHT DUMP
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: -2,
          }}
        >
          A wall of sticky thoughts.
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#9fb0cd" }}>
          Sign in to read the wall.
        </div>
      </div>
    ),
    { ...size },
  );
}

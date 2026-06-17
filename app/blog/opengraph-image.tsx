import { ImageResponse } from "next/og";

export const alt = "OSM Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default OG card for the blog (index, category, tag, search). */
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
          background: "#09090b",
          color: "#f4f4f2",
          padding: "88px",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 10, color: "#ff6a4d", fontWeight: 700 }}>
          OSM — BLOG
        </div>
        <div style={{ display: "flex", fontSize: 120, fontWeight: 800, letterSpacing: -3, lineHeight: 0.9 }}>
          Rabbit holes<span style={{ color: "#ff6a4d" }}>.</span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#a0a0a6" }}>
          Deep dives into whatever I&rsquo;m currently obsessed with.
        </div>
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/portfolio/queries";

export const alt = "Manan Shah — software / AI-native engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const profile = await getProfile();
  const name = profile?.name || "Manan Shah";
  const tagline = profile?.tagline || "software / AI-native engineer";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b0c",
          padding: "88px",
          color: "#fafaf9",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 8,
            color: "#ff7a6b",
            fontWeight: 700,
          }}
        >
          ● PORTFOLIO
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 104, fontWeight: 800, letterSpacing: -3 }}>
            {name}
            <span style={{ color: "#ff5a4d" }}>.</span>
          </div>
          <div style={{ display: "flex", marginTop: 12, fontSize: 32, color: "#9a9aa0" }}>
            {tagline}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

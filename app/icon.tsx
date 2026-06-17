import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon — the OSM "o." monogram (the period is the brand accent). */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0c",
          color: "#f4f4f2",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: -1,
        }}
      >
        o<span style={{ color: "#ff4d2e" }}>.</span>
      </div>
    ),
    { ...size },
  );
}

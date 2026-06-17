import { ImageResponse } from "next/og";

export const alt = "OSM";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default OG card for the editorial site (home, /osm, /changelog). */
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
          background: "#f5f1e7",
          color: "#221c15",
          padding: "90px",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
          OSM<span style={{ color: "#8c2b1c" }}>.</span>
        </div>
        <div style={{ display: "flex", fontSize: 64, lineHeight: 1.1, maxWidth: 900 }}>
          An open-source corner of the internet
          <span style={{ color: "#8c2b1c" }}>.</span>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#6d6354" }}>
          Portfolio · Writing · Experiments
        </div>
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from "next/og";
import { getPublicPostMeta } from "@/lib/blog/queries";

export const alt = "OSM Blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = await getPublicPostMeta(slug);
  const title = meta?.title ?? "Rabbit holes";
  const category = (meta?.categoryName ?? "The Blog").toUpperCase();

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
          padding: "88px",
          color: "#f4f4f2",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 10,
            color: "#ff6a4d",
            fontWeight: 700,
          }}
        >
          OSM — BLOG
        </div>
        <div
          style={{
            display: "flex",
            fontSize: title.length > 48 ? 76 : 96,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: -2,
            maxWidth: 1024,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#a0a0a6", letterSpacing: 6 }}>
          {category}
        </div>
      </div>
    ),
    { ...size },
  );
}

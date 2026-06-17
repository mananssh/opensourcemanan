import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const FONT_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/fraunces/files/fraunces-latin-700-normal.woff";

/** Favicon — a lowercase serif "m." monogram (the period is the brand accent).
 *  This route is static, so the serif font is fetched once at build time. */
export default async function Icon() {
  let fonts: { name: string; data: ArrayBuffer; weight: 700; style: "normal" }[] | undefined;
  try {
    const data = await fetch(FONT_URL).then((r) => r.arrayBuffer());
    fonts = [{ name: "Fraunces", data, weight: 700, style: "normal" }];
  } catch {
    fonts = undefined; // fall back to the default sans if the font can't load
  }

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
          fontFamily: fonts ? "Fraunces" : undefined,
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        m<span style={{ color: "#ff4d2e" }}>.</span>
      </div>
    ),
    { ...size, fonts },
  );
}

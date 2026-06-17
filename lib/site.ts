/** Canonical site origin, no trailing slash. Used by metadata, sitemap, RSS. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

/** Shared identity used by metadata, JSON-LD, and feeds. */
export const siteName = "OSM";
export const siteAuthor = { name: "Manan Shah", url: siteUrl } as const;
export const blogTitle = "OSM Blog";
export const blogDescription =
  "Deep dives into whatever I'm currently obsessed with — no single topic, just things worth thinking hard about.";

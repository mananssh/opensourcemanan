---
type: feat
summary: Blog SEO pass — metadata, canonical, JSON-LD, richer RSS + JSON/per-category feeds
---

Addresses the blog audit (§2):
- Set metadataBase so OG/canonical/Twitter URLs resolve absolutely.
- Per-post canonical, Twitter summary_large_image, OG url/modifiedTime, and
  robots noindex on drafts. Category/tag pages get canonicals + OG.
- Post JSON-LD now includes author, image (OG), mainEntityOfPage, publisher and
  a BreadcrumbList; site-wide Person + WebSite JSON-LD added.
- RSS rewritten: atom self-link, content/dc namespaces, language, lastBuildDate,
  per-item author + category, always-present description (excerpt or truncated
  body) + content:encoded; correct XML escaping. Auto-discovery <link> added.
- New JSON Feed (/blog/feed.json) and per-category RSS
  (/blog/category/<slug>/feed.xml, public categories only).
- Sitemap: dropped meaningless static-route lastmod, added category + tag pages,
  set changefreq/priority.

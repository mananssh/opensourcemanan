---
type: feat
summary: Reel redesign — "VHS / Video Nasty" theme, live search dropdown polish, fixed shareable cards
---

Reel gets its own identity instead of reading like the OSM main page, plus two
fixes. The frontend was designed with the `ui-ux-pro-max` skill (styles #68
Vintage Analog / Retro Film + #11 Retro-Futurism) and validated against its
pre-delivery checklist. Design brief committed at `docs/design/reel-vhs.md`.

**VHS / Video Nasty theme** — the `/movies` vertical is now dark-first: a
violet-black auditorium lit by neon **magenta + cyan** (a new `--accent-2`
token), CRT scanlines, tape grain, and a glitchy chromatic-aberration wordmark
(`.vhs-title`). Light mode is a cool "video-store daylight" (lilac-grey), never
OSM's warm kraft. New fonts: **Bebas Neue** (VHS-box display) / **DM Sans**
(body) / **Space Mono** (timecode). Every color pair WCAG-validated in both
themes (ink ≥12:1, muted ≥6.5:1, faint/accent/accent-2 ≥4.5:1). Favorite toggles
now use an SVG heart, not an emoji, per the checklist.

**Search dropdown** — live suggestions already existed; this adds full keyboard
nav (↑/↓/Enter/Esc), hover-sync, ARIA combobox roles, and — crucially — a clear
"add `TMDB_API_KEY`" hint when the key is missing (previously it silently showed
"no matches", which read as broken).

**Shareable cards fixed** — the Instagram story/square OG cards had text cut off
and an invisible ★ glyph (satori's default font lacks it). Rebuilt on the VHS
palette with width-constrained, truncated text and a **drawn SVG star** instead
of the glyph, so nothing clips and every element renders.

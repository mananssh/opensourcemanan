---
type: fix
summary: Stop Geetdle rendering the ARCD chrome twice (route-group fix)
---

Geetdle was wrapped by both the `/games` (ARCD) layout and its own layout, so it
showed two stacked headers and two footers — and the outer ARCD footer, in a
separate stacking context, bled over Geetdle's share modal. Move the ARCD chrome
and the arcade index pages into a `(arcade)` route group so that chrome only
wraps the arcade listing, leaving Geetdle with just its own layout. URLs are
unchanged (`/games`, `/games/[slug]`, `/games/geetdle`).

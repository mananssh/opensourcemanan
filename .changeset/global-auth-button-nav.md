---
type: feat
summary: Global sign-in button + standalone verticals (nav IA)
---

Add a persistent auth control (AuthButton) to every header: shows "Sign in"
when logged out and a signed-in pill with a sign-out menu when logged in,
powered by a client SessionProvider and reactive to sign-in. Themed with
semantic tokens so it adapts per vertical. IA: OSM home is the directory (its
index lists the verticals), so the site navbar is now just the wordmark + theme
toggle + auth (no vertical links). Verticals stand alone — removed the blog's
"← osm" header/footer backlinks. Static pages stay static (the auth control is a
client island).

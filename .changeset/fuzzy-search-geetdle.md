---
type: feat
summary: Fuzzy-match the Geetdle song search so typos and transliterations still find songs
---

The guess autocomplete now runs a local Fuse.js fuzzy match instead of exact
substring matching. Alternate Hindi transliterations (e.g. "khwabon" finds
"Khaabon Ke Parindey"), minor typos, and phonetic slips now surface the right
song. Matching is weighted title → movie → singers, so searching a singer's name
(e.g. "kishore") lists their songs. Near-ties in relevance fall back to the
catalog's popularity order, keeping the obvious songs on top. Search stays
fully client-side and instant — no network round-trip per keystroke, and the
input UI is unchanged.

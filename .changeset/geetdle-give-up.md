---
type: feat
summary: Geetdle — add a "give up" option that reveals the answer
---

Players can now bow out of a Geetdle puzzle without exhausting all 8 guesses.
A "Give up & reveal song" link under the guess box asks for confirmation, then
flips the game to its ended state — revealing the song, poster and audio, with a
distinct "You gave up" message. The answer is still fetched from the server
(seeded by the server-only salt) via a new `/api/geetdle/giveup` route, and the
choice persists across refreshes like the rest of the game progress.

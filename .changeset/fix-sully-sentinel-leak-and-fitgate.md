---
type: fix
summary: Fix a JSON-sentinel leak into the thinking stream and an over-eager fit_gate decline
---

Two bugs found from a live trace ("Cloud Engineer at naabhik technologies"
declined as "not a job description"):

1. **Sentinel leak.** The streamed reasoning could show a fragment of the
   internal `@@@JSON@@@` marker (e.g. a literal "@@@JSON" in the visible
   text) when it arrived split across two stream chunks — the naive
   `indexOf` search only catches a *complete* marker already in the buffer.
   `model-router.ts` now holds back a lookback window equal to the marker's
   length until either the full marker resolves or the stream ends, so a
   split marker can never leak a partial prefix into what the reader sees.
2. **Over-eager `fit_gate` decline.** `fit_gate` only ever saw the *already-
   extracted* `role`/`requirements`, never the raw pasted text — so a short,
   perfectly legitimate posting (just a title + company, no elaborated
   requirements) could read as "not a genuine role" once reduced to an empty
   requirements list, and the model sometimes hallucinated a specific wrong
   reason ("appears to be a prompt or instruction"). Meanwhile `intake`
   already computes its own `looksLikeRole` judgment (with the full raw text
   in view) but the graph silently discarded it. `looksLikeRole` is now
   threaded through `AgentState` from `intake` to `fit_gate`, and both the
   private and public fallback prompts defer to that earlier judgment and
   explicitly note that brevity alone isn't disqualifying.

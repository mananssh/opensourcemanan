---
type: fix
summary: Stop sending stream_options to model lanes — it silently killed Gemini
---

Every Sully run was falling over from Gemini (the primary, fastest, cheapest
lane) to NVIDIA NIM/OpenCode Zen, even though Gemini worked fine on its own.
Root cause: `stream_options: { include_usage: true }` in every model-router
request. Gemini's OpenAI-compat shim can't handle that field and returns a
misleading `503 UNAVAILABLE ("high demand")` instead of a clean 400 — which
the router correctly (but uselessly) treats as a retryable failure and fails
over on every single call. Confirmed by direct testing: identical requests
succeed at 200 without `stream_options` and fail at 503 with it, on both
non-streaming and streaming calls. Token usage now always uses the existing
character-based estimate instead of a provider-reported exact count, which
was already the graceful fallback for lanes that don't return usage.

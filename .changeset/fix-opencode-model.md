---
type: fix
summary: Fix the Gemini + OpenCode Zen model ids (verified each lane with a direct call)
---

Tested every model lane with a direct API call and corrected two stale defaults:

- **Gemini** → `gemini-2.5-flash-lite` (both tiers). `gemini-2.0-flash` now 429s
  (deprecated/unavailable, not a quota issue — `2.5-flash-lite` works on the same
  key), and `gemini-2.5-flash` returns empty under a token budget (thinking mode).
  `2.5-flash-lite` is available, fast, non-thinking, and returns clean output.
- **OpenCode Zen** → `deepseek-v4-flash-free`. The rotating free roster dropped
  `glm-5-free` (401 "not supported"); non-`-free` models 401 "No payment method".
  `deepseek-v4-flash-free` verified 200.

NVIDIA NIM (8B + 70B) and Tavily verified working unchanged.

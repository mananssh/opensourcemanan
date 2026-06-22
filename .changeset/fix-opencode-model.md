---
type: fix
summary: Fix the OpenCode Zen failover model id (free roster rotated)
---

The OpenCode Zen failover lane defaulted to `glm-5-free`, which the rotating free
roster no longer offers (it 401'd "Model not supported"; the non-`-free` models
401 "No payment method"). Verified each lane with a direct call and switched the
default to `deepseek-v4-flash-free` (200 OK). Gemini, NVIDIA NIM (8B + 70B), and
Tavily all verified working; Gemini's free daily quota was just temporarily
exhausted from testing.

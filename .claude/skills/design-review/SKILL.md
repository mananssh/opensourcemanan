---
description: Conscious frontend design review before building any UI — commit to an aesthetic direction, distinctive type, and a light+dark token set instead of defaulting to generic/AI-slop styling.
---

# /design-review

Run this **before** implementing any new UI surface (page, major component,
feature front-end). Good design is a deliberate choice, not a default — this is
the step that prevents generic, "AI-generated"-looking output. See ADR 0006 and
`agent-kit/conventions.md` §4.

## Steps

1. **Read the system.** `app/globals.css` (the design tokens + fonts) and
   `agent-kit/conventions.md` §4. The baseline is the **Editorial Logbook**
   (Fraunces + Newsreader + JetBrains Mono; warm paper/ink; oxblood/terracotta
   accent). Default to matching it.

2. **Decide: match or diverge?** Most surfaces should match the baseline for
   coherence. If a feature should look different, say *why* — divergence is a
   conscious decision, not an accident.

3. **Commit to a brief** (write it down, e.g. in the PR description):
   - **Direction / tone** — the concept. Not "clean and modern."
   - **Typography** — display + body + mono. No system fonts, no Inter/Roboto,
     no overused picks. Distinctive and legible.
   - **Color** — semantic tokens for **both** light and dark (ADR 0005). Dominant
     color + sharp accent beats a timid even palette.
   - **Layout & differentiation** — the one memorable thing (spatial idea,
     motion moment, texture, detail).

4. **Check against the anti-slop list.** Reject: system/Inter/Roboto fonts,
   purple-gradient-on-white, predictable centered-card layouts, single-mode
   color, decoration without intent.

5. **Then build** — and verify in **both themes** before calling it done.

Advisory by design — taste can't be linted. The point is to *think first*.

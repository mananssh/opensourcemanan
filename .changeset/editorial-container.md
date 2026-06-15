---
type: refactor
summary: Extract a single page-width container and widen the measure
---

The page width was hardcoded as `max-w-2xl` in five places (header, footer,
and all three pages). Extracted it into one `container-editorial` utility in
the design system, so the site measure is a single source of truth — change it
once, everywhere. Widened from 42rem to 48rem (max-w-3xl) so wide screens feel
less empty while keeping an editorial line length.

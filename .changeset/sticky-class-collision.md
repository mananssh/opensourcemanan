---
type: fix
summary: Stop sticky-note styles leaking onto every navbar
---

The Thought Dump note styles used a `.sticky` class, which collides with
Tailwind's `sticky` position utility that every vertical's sticky header uses —
so the "tape" pseudo-element and hover/lift transform leaked onto all navbars.
Renamed to `.sticky-note` (scoped to the dump notes only).

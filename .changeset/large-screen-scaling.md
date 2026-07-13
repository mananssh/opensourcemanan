---
type: feat
summary: scale the whole design system up on large screens via stepped root font-size
---

On big monitors the site shrank to a strip: the widest container (`max-w-5xl`
= 64rem = 1024px) covered barely 40% of a 1440p display, leaving the rest
blank. Because every container, type size, and spacing token in the system is
rem-based, the systemic fix is one primitive: step the root font-size up on
large viewports, and every vertical scales proportionally — containers widen,
type grows, and the reading measure stays identical in characters. No layout
reflows differently.

Steps (breakpoints resolve against the initial 16px, so they never shift):

- ≥1600px → 17px root (`max-w-5xl` ≈ 68% of a 1600 display)
- ≥1920px → 18.5px root (≈ 62% of 1920, up from 53%)
- ≥2400px → 20.5px root (≈ 51–55% of 1440p glass, up from 40%)

Laptops at ≤1536px keep the classic 16px baseline, untouched.

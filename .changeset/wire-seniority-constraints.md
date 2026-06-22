---
type: feat
summary: Wire intake's seniority + hard constraints through to the gate and plan
---

intake already extracts `seniority` and `constraints` (location / work-auth /
clearance / required degree); they were computed then dropped. Now they're stored
in state and provided to the fit_gate and plan prompts as `{{seniority}}` /
`{{constraints}}`, so the gate can treat a seniority gap or hard constraint as a
named "plausible" stretch (not a decline) and plan can ensure a dimension speaks
to it. Public fallback prompts use the new fields; tuned prompts opt in by adding
the placeholders.

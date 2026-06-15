---
type: fix
summary: Use the directory/SKILL.md layout for project skills
---

Project skills must live at `.claude/skills/<name>/SKILL.md` (the skill
name derives from the directory) to be discovered by Claude Code. Moved
the five flat `.claude/skills/<name>.md` files into that layout so
/commit, /ship, /oss-check, /devils-advocate, and /feature appear.

---
type: fix
summary: Wider, legible post editor (themed) + local draft autosave
---

Fix the post editor reported issues: the create/edit form is now full-width
(was a narrow left-aligned column); the editor content reuses the blog's prose
styles so headings (h1–h6), paragraphs, lists, and task-list checkboxes render
correctly inside the editor; and MDXEditor's theme variables are mapped onto our
design tokens so it follows the light/dark palette and everything is legible
(replacing the unreliable dark-theme toggle). Adds local draft autosave: the
body is saved to localStorage as you type and restored on return (with a Discard
option), so progress isn't lost to an accidental refresh/close.

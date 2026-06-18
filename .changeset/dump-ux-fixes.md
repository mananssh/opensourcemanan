---
type: fix
summary: Dump composer image reset, whole-note links, sign-in returns to origin
---

- The image preview/key now clears after posting a thought (ImageUpload listens
  for the form's reset event; form.reset() only clears native fields).
- The whole sticky note links to its permalink, not just the date.
- Signing in returns you to where you came from: the sign-in page honors a safe
  internal `?next=` (open-redirect-guarded), and the header sign-in button passes
  the current page as the callback.

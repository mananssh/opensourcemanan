---
type: feat
summary: Add NextAuth v5 (Google OAuth) as the shared Access-axis primitive
---

NextAuth v5 (Auth.js) with Google OAuth and JWT sessions, configured once in
lib/auth.ts. Features declare access via server-side guards — requireAuth()
(any signed-in user) and requireOwner() (OWNER_EMAILS allowlist) — never
re-checking sessions themselves. Adds the route handler, session typing, and an
editorial /sign-in page (server-action sign in/out). Checks run server-side, not
in Proxy (Next 16's renamed Middleware), per Next 16 guidance. Requires
AUTH_SECRET, AUTH_GOOGLE_ID/SECRET, OWNER_EMAILS (ADR 0008).

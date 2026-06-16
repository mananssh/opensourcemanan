# Auth — the Access-axis primitive

One auth setup for the whole site: **NextAuth v5 (Auth.js) + Google OAuth**, JWT
sessions (no database needed). Configure once in `lib/auth.ts`; features declare
their access by calling a guard — they never re-implement session checks. See
[ADR 0008](../docs/decisions/0008-nextauth-google.md).

## Access levels

| Level | How | Who |
|-------|-----|-----|
| `public` | nothing | everyone (the default) |
| `authed` | `await requireAuth()` | any signed-in Google user |
| `owner` | `await requireOwner()` | accounts in `OWNER_EMAILS` |

Checks are **server-side**, in the page / route / data layer — not in Proxy
(Next 16's renamed Middleware). Per Next 16's own guidance, Proxy is for
optimistic redirects only, never the real authorization boundary.

## Using it in a feature

```ts
// Owner-only page (e.g. authoring):
import { requireOwner } from "@/lib/auth";

export default async function NewPostPage() {
  await requireOwner(); // redirects non-owners; returns the session otherwise
  return <Editor />;
}
```

```ts
// Read the session without forcing sign-in:
import { auth } from "@/lib/auth";
const session = await auth();
if (session?.user.isOwner) {
  /* show edit affordances */
}
```

`requireAuth()` redirects anonymous users to `/sign-in`. `requireOwner()` also
sends non-owners home. Sign-in/out happens at **`/sign-in`** via Google.

## Setup (one-time)

1. **Google OAuth client** — Google Cloud Console → APIs & Services →
   Credentials → Create OAuth client ID (Web application). Authorized redirect
   URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-domain>/api/auth/callback/google`
2. **Env** (see `.env.example`): `AUTH_SECRET` (`openssl rand -base64 32`),
   `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `OWNER_EMAILS`. Add to `.env.local`
   for dev and to the **Vercel** project for production.

`.env*` is gitignored — never commit real secrets (see
[oss-safety.md](./oss-safety.md)).

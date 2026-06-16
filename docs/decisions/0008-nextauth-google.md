# ADR 0008 — NextAuth v5 (Auth.js) + Google for the Access axis

**Status:** Accepted · 2026-06-16

## Context

Some features will be gated (owner-only authoring, eventually maybe authed-only
areas). We need one shared auth primitive — configured once, used declaratively
— rather than per-feature session logic. Requirement: Google OAuth.

## Decision

**NextAuth v5 (Auth.js)** with the **Google** provider, **JWT sessions**.

- **v5, not v4.** v4 predates the App Router; v5 is App-Router-native — a
  universal `auth()` helper for server components, server-action `signIn`/
  `signOut`, and no client `SessionProvider` required. v5's peer deps officially
  include Next 16 and React 19.
- **Server-side checks, not Proxy.** Next 16 renamed Middleware to "Proxy" and
  its docs are explicit that Proxy is for optimistic redirects, not the real
  authorization boundary. So guards (`requireAuth`, `requireOwner`) run in the
  page / route / data layer.
- **Owner model.** Anyone can authenticate with Google, but `isOwner` is derived
  from an `OWNER_EMAILS` allowlist (surfaced on the session + JWT). This gives
  three access levels — `public` / `authed` / `owner` — matching the four-axis
  Access options. Default-deny: if `OWNER_EMAILS` is unset, nobody is owner.
- **JWT sessions**, no database adapter. Simpler, and decouples auth from the
  shared DB. A Drizzle adapter can be added later if DB-backed sessions/accounts
  are ever needed.

## Consequences

- Env required: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`,
  `OWNER_EMAILS` — in `.env.local` (dev) and Vercel (prod). Never committed.
- `trustHost: true` for single-host Vercel deployment.
- Pages that call `auth()` become dynamic (they read cookies) — expected.
- Importing `lib/auth.ts` is build-safe without secrets; NextAuth only needs
  them at request time, so CI `next build` passes without auth env.
- v5 is still beta; pinned and to be watched, but it's the only App-Router-native
  option and declares Next 16 support.

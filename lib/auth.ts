import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { redirect } from "next/navigation";

/**
 * The shared Access-axis primitive. NextAuth v5 (Auth.js) with Google OAuth,
 * JWT sessions (no DB needed). Configure once here; features declare their
 * access by calling a guard — they never re-implement session checks.
 *
 * Env (see .env.example):
 *   AUTH_SECRET          — required; signs the session JWT.
 *   AUTH_GOOGLE_ID/SECRET — Google OAuth client (read automatically by the provider).
 *   OWNER_EMAILS         — comma-separated allowlist of owner accounts.
 *
 * See agent-kit/auth.md and ADR 0008.
 */
const ownerEmails = (process.env.OWNER_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function isOwnerEmail(email?: string | null): boolean {
  return !!email && ownerEmails.includes(email.toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  // Single-host deployment on Vercel; trust the forwarded host.
  trustHost: true,
  callbacks: {
    jwt({ token }) {
      token.isOwner = isOwnerEmail(token.email);
      return token;
    },
    session({ session, token }) {
      session.user.isOwner = Boolean(token.isOwner);
      return session;
    },
  },
});

/**
 * Guard: require any signed-in user. Redirects to /sign-in otherwise.
 * Use at the top of a server component / route for `authed` access.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return session;
}

/**
 * Guard: require the owner. Redirects unauthenticated users to /sign-in and
 * non-owners home. Use for `owner`-only features (authoring, admin).
 */
export async function requireOwner() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (!session.user.isOwner) redirect("/");
  return session;
}

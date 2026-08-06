import "server-only";
import { notFound } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

/**
 * The Vault's access gate — the STRICTEST in the repo.
 *
 * Unlike `requireOwner()` (which trusts the whole `OWNER_EMAILS` allowlist), the
 * vault is locked to exactly ONE account: `VAULT_OWNER_EMAIL`. Not another owner,
 * not a signed-in stranger — only this email. Everyone else is treated as if the
 * vertical does not exist (`notFound()` → a 404, never a redirect to /sign-in),
 * so the route never even confirms it's there.
 *
 * Fail-closed: if `VAULT_OWNER_EMAIL` is unset, NO account is the owner and the
 * whole vertical 404s for everyone (better locked-out than wide-open). The email
 * is read from the environment, never committed to this public repo. What
 * ultimately protects the documents is the encryption key + the private bucket,
 * not the secrecy of who the owner is. See lib/vault/crypto.ts, docs/design/vault.md.
 */
const OWNER = (process.env.VAULT_OWNER_EMAIL ?? "").trim().toLowerCase();

/** The single email allowed into the vault. */
export function vaultOwnerEmail(): string {
  return OWNER;
}

/** True only for the one vault-owner account. False if no owner is configured. */
export function isVaultOwner(session: Session | null): boolean {
  const email = session?.user?.email;
  return !!OWNER && !!email && email.toLowerCase() === OWNER;
}

/**
 * Page / layout / server-action guard. 404s anyone who is not the vault owner —
 * including signed-out visitors and other owners — without disclosing the route.
 */
export async function requireVaultOwner(): Promise<Session> {
  const session = await auth();
  if (!isVaultOwner(session)) notFound();
  return session as Session;
}

/**
 * API-route guard. Returns the session for the vault owner, or `null` so the
 * route can reply with a bare 404 (never a 401/403 that would confirm the vault
 * exists). Use at the very top of every /api/vault/* handler.
 */
export async function vaultOwnerOrNull(): Promise<Session | null> {
  const session = await auth();
  return isVaultOwner(session) ? (session as Session) : null;
}

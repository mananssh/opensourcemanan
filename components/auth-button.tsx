"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

/**
 * Global auth control — present in every header. Shows "Sign in" when logged
 * out and flips to a signed-in pill (with a sign-out menu) reactively on sign in,
 * via next-auth's client session. Themed with semantic tokens so it adapts to
 * each vertical's look.
 */
export function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="h-8 w-[4.5rem] animate-pulse rounded-full bg-rule/60" aria-hidden />
    );
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: window.location.href })}
        className="inline-flex h-8 items-center rounded-full border border-rule px-3.5 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-ink transition-colors hover:border-accent hover:text-accent"
      >
        Sign in
      </button>
    );
  }

  const user = session.user;
  const label = user.name?.split(" ")[0] ?? user.email ?? "Account";
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-2 rounded-full border border-rule py-0.5 pl-0.5 pr-3 transition-colors hover:border-accent"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
          {initial}
        </span>
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink">
          {label}
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-rule bg-surface p-2 shadow-lg"
          >
            <p className="truncate px-2 py-1 font-mono text-[0.7rem] text-faint">
              {user.email}
              {user.isOwner ? " · owner" : ""}
            </p>
            {user.isOwner && (
              <Link
                href="/blog/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-md px-2 py-1.5 font-mono text-xs text-ink transition-colors hover:bg-accent-soft hover:text-accent"
              >
                Blog admin
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut()}
              className="mt-1 w-full rounded-md px-2 py-1.5 text-left font-mono text-xs text-ink transition-colors hover:bg-accent-soft hover:text-accent"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

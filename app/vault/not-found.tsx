import Link from "next/link";
import { LockIcon } from "@/components/vault/icons";

export default function VaultNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col items-center justify-center gap-4 px-6 text-center">
      <LockIcon className="text-3xl text-accent" />
      <h1 className="font-display text-3xl font-semibold text-ink">Nothing here</h1>
      <p className="max-w-sm text-muted">
        That document or page isn&rsquo;t in the vault.
      </p>
      <Link
        href="/vault"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent"
      >
        Back to the vault
      </Link>
    </div>
  );
}

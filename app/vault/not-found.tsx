import Link from "next/link";

export default function VaultNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col justify-center px-6 py-24">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-accent">
        Seal missing
      </p>
      <h1 className="vault-wordmark mt-4 font-display text-[clamp(2.5rem,8vw,4.5rem)] font-semibold text-ink">
        Nothing here
      </h1>
      <p className="mt-4 max-w-sm text-muted">
        That document or page isn&rsquo;t in the vault.
      </p>
      <Link
        href="/vault"
        className="mt-10 inline-flex w-fit border border-accent bg-accent px-5 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-accent-ink transition-colors hover:bg-transparent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
      >
        ← Vault
      </Link>
    </div>
  );
}

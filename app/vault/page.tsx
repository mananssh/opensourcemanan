import { listDocuments, computeStats } from "@/lib/vault/queries";
import { isVaultCryptoConfigured } from "@/lib/vault/crypto";
import { formatBytes } from "@/lib/vault/format";
import { VaultConsole } from "@/components/vault/vault-console";
import { ShieldIcon } from "@/components/vault/icons";

// The vault is entirely dynamic + owner-gated; never statically cached.
export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const cards = await listDocuments();
  const stats = computeStats(cards);
  const configured = isVaultCryptoConfigured();

  return (
    <div className="vault-reveal mx-auto w-full max-w-5xl px-6 py-10 sm:py-14">
      {/* Hero */}
      <div className="flex flex-col gap-4">
        <p className="inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-accent-2">
          <ShieldIcon className="text-sm" />
          Private · encrypted at rest
        </p>
        <h1 className="vault-wordmark font-display text-5xl font-bold leading-none text-ink sm:text-6xl">
          THE VAULT
        </h1>
        <p className="max-w-prose text-lg leading-relaxed text-muted">
          Your documents, sealed. Every file is AES-256 encrypted before it
          leaves this server and stored in a private bucket no one else can
          reach. Only you can open it.
        </p>
      </div>

      {/* Stat strip */}
      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Documents" value={String(stats.total)} />
        <Stat label="Encrypted size" value={formatBytes(stats.totalBytes)} />
        <Stat label="Favorites" value={String(stats.favorites)} />
        <Stat label="Categories" value={String(stats.byCategory.length)} />
      </dl>

      <VaultConsole cards={cards} configured={configured} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-rule bg-surface px-4 py-3">
      <dt className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-faint">
        {label}
      </dt>
      <dd className="mt-1 font-display text-2xl font-semibold text-ink">{value}</dd>
    </div>
  );
}

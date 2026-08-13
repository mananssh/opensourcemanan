import { listDocuments, computeStats } from "@/lib/vault/queries";
import { isVaultCryptoConfigured } from "@/lib/vault/crypto";
import { VaultConsole } from "@/components/vault/vault-console";
import { VaultHero } from "@/components/vault/vault-hero";

// The vault is entirely dynamic + owner-gated; never statically cached.
export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const cards = await listDocuments();
  const stats = computeStats(cards);
  const configured = isVaultCryptoConfigured();

  return (
    <div className="vault-reveal mx-auto w-full max-w-5xl px-6 py-10 sm:py-14">
      <VaultHero
        stats={{
          total: stats.total,
          totalBytes: stats.totalBytes,
          favorites: stats.favorites,
          categories: stats.byCategory.length,
        }}
      />
      <VaultConsole cards={cards} configured={configured} />
    </div>
  );
}

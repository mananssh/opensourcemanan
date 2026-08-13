"use client";

import { useReducedMotion, motion } from "motion/react";
import { formatBytes } from "@/lib/vault/format";

export type VaultHeroStats = {
  total: number;
  totalBytes: number;
  favorites: number;
  categories: number;
};

/**
 * Kinetic-type Vault seal — see docs/design/vault.md ("Blacklight Notary").
 */
export function VaultHero({ stats }: { stats: VaultHeroStats }) {
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? { initial: false as const, animate: { y: "0%", opacity: 1 } }
      : {
          initial: { y: "112%", opacity: 0 },
          animate: { y: "0%", opacity: 1 },
          transition: {
            duration: 0.9,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <header className="overflow-x-clip">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-accent-2">
          Sealed · AES-256 · Owner
        </p>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-faint">
          Private ledger
        </p>
      </div>

      <div className="mt-6 overflow-hidden">
        <motion.h1
          {...rise(0.04)}
          className="vault-wordmark font-display text-[clamp(4.5rem,16vw,10rem)] font-semibold text-ink"
        >
          Vault
        </motion.h1>
      </div>

      <motion.p
        {...(reduce
          ? { initial: false as const, animate: { opacity: 1 } }
          : {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { duration: 0.45, delay: 0.35 },
            })}
        className="mt-6 max-w-xl text-lg leading-relaxed text-muted"
      >
        Identity documents under wax and ultraviolet. Every file is AES-256
        sealed before it leaves this server — only you can break the seal.
      </motion.p>

      <motion.dl
        {...(reduce
          ? { initial: false as const, animate: { opacity: 1 } }
          : {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { duration: 0.4, delay: 0.48 },
            })}
        className="mt-10 grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-4"
      >
        <Stat label="Documents" value={String(stats.total)} />
        <Stat label="Encrypted" value={formatBytes(stats.totalBytes)} />
        <Stat label="Favorites" value={String(stats.favorites)} />
        <Stat label="Categories" value={String(stats.categories)} />
      </motion.dl>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-4">
      <dt className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-faint">
        {label}
      </dt>
      <dd className="mt-1.5 font-display text-2xl font-semibold tracking-wide text-ink">
        {value}
      </dd>
    </div>
  );
}

import "server-only";
import { cache } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { vaultDocuments, type VaultDocument, type VaultCategory } from "@/db/schema";
import { safeDb } from "@/lib/blog/safe-db";

/**
 * Vault store. Every read here is already behind `requireVaultOwner()` at the
 * route/action layer, so these are unfiltered — but the CLIENT-facing shape
 * (`VaultDocCard`) deliberately omits the encryption material (`wrappedKey`,
 * `keyIv`, `keyAuthTag`) and the internal `storageKey`. Those never leave the
 * server; the client only ever holds a document `id`.
 */

/** Client-facing document metadata — no crypto material, no storage key. */
export interface VaultDocCard {
  id: string;
  title: string;
  category: VaultCategory;
  tags: string[];
  notes: string | null;
  favorite: boolean;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export function toCard(r: VaultDocument): VaultDocCard {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    tags: r.tags,
    notes: r.notes,
    favorite: r.favorite,
    originalFilename: r.originalFilename,
    contentType: r.contentType,
    sizeBytes: r.sizeBytes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

/** All documents, newest first, as client-safe cards. */
export const listDocuments = cache(async (): Promise<VaultDocCard[]> => {
  return safeDb(async () => {
    const rows = await db
      .select()
      .from(vaultDocuments)
      .orderBy(desc(vaultDocuments.createdAt));
    return rows.map(toCard);
  }, []);
});

/**
 * The FULL row for one document, including the encryption envelope — for
 * server-side decryption only (the download route). Never map this to a client
 * payload. Returns null if missing.
 */
export const getDocumentRecord = cache(
  async (id: string): Promise<VaultDocument | null> => {
    return safeDb(async () => {
      const [row] = await db
        .select()
        .from(vaultDocuments)
        .where(eq(vaultDocuments.id, id))
        .limit(1);
      return row ?? null;
    }, null);
  },
);

export interface VaultStats {
  total: number;
  totalBytes: number;
  favorites: number;
  byCategory: { category: VaultCategory; count: number }[];
}

/** Pure aggregation over already-loaded cards (no extra DB round-trip). */
export function computeStats(cards: VaultDocCard[]): VaultStats {
  const counts = new Map<VaultCategory, number>();
  let totalBytes = 0;
  let favorites = 0;
  for (const c of cards) {
    counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    totalBytes += c.sizeBytes;
    if (c.favorite) favorites++;
  }
  const byCategory = [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
  return { total: cards.length, totalBytes, favorites, byCategory };
}

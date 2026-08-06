import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Vault — the private, single-owner encrypted document store (/vault).
 *
 * This table holds ONLY metadata and the *wrapped* encryption key. The document
 * bytes live encrypted in the private R2 bucket under `storageKey`; the raw
 * per-file data key is never stored — only its form encrypted under the master
 * key (`wrappedKey` + `keyIv` + `keyAuthTag`; see lib/vault/crypto.ts). A dump of
 * this table alone decrypts nothing without the environment's master key.
 *
 * Access is the strictest in the repo: only `VAULT_OWNER_EMAIL` (lib/vault/access.ts),
 * so there is no per-row owner column — the gate is the boundary. Nothing here is
 * ever made public.
 */
export const vaultCategory = pgEnum("vault_category", [
  "identity",
  "financial",
  "medical",
  "legal",
  "education",
  "work",
  "travel",
  "other",
]);

export const vaultDocuments = pgTable(
  "vault_documents",
  {
    id: uuid().primaryKey().defaultRandom(),
    // Owner-authored, searchable metadata.
    title: text().notNull(),
    category: vaultCategory().notNull().default("other"),
    tags: text().array().notNull().default([]),
    notes: text(),
    favorite: boolean().notNull().default(false),
    // Original-file facts (for display + correct download).
    originalFilename: text().notNull(),
    contentType: text().notNull(),
    sizeBytes: integer().notNull(), // plaintext size, for display
    // Encryption envelope — the ciphertext lives in R2 at `storageKey`.
    storageKey: text().notNull().unique(),
    wrappedKey: text().notNull(), // per-file DEK, encrypted under the master key
    keyIv: text().notNull(),
    keyAuthTag: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vault_documents_category_idx").on(t.category),
    index("vault_documents_created_idx").on(t.createdAt),
  ],
);

export type VaultDocument = typeof vaultDocuments.$inferSelect;
export type VaultCategory = (typeof vaultCategory.enumValues)[number];

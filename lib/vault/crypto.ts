import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Envelope encryption for vault documents (AES-256-GCM).
 *
 * Every file gets its own random 256-bit **data key (DEK)** that encrypts the
 * bytes. That DEK is then itself encrypted ("wrapped") under the **master key
 * (KEK)** from `VAULT_MASTER_KEY`, and only the wrapped form is persisted. So:
 *
 *   - R2 (private bucket) holds ONLY ciphertext — never the DEK, never plaintext.
 *   - The DB holds ONLY the wrapped DEK + IVs + GCM auth tags — useless without
 *     the master key.
 *   - The master key lives ONLY in the environment (never the repo, never logged).
 *
 * A breach of the bucket OR the database in isolation reveals nothing. GCM auth
 * tags mean any tampering with the ciphertext fails the decrypt (integrity, not
 * just secrecy). Per-file DEKs keep the blast radius of any single leak to one
 * document and make future key rotation possible (re-wrap DEKs, don't re-encrypt
 * files). See docs/design/vault.md.
 *
 * The stored R2 blob is self-describing: [ fileIv(12) | fileAuthTag(16) | ciphertext ].
 */
const ALGO = "aes-256-gcm";
const IV_LEN = 12; // 96-bit nonce, the GCM standard
const TAG_LEN = 16; // 128-bit GCM auth tag
const KEY_LEN = 32; // AES-256

/** The wrapped-key material persisted alongside a document row. */
export interface WrappedKey {
  /** base64: the per-file DEK, encrypted under the master key. */
  wrappedKey: string;
  /** base64: IV used to wrap the DEK. */
  keyIv: string;
  /** base64: GCM auth tag from wrapping the DEK. */
  keyAuthTag: string;
}

export interface SealedDocument extends WrappedKey {
  /** The bytes to write to R2 (self-describing: iv | tag | ciphertext). */
  blob: Buffer;
}

function masterKey(): Buffer {
  const raw = process.env.VAULT_MASTER_KEY;
  if (!raw) {
    throw new Error(
      "VAULT_MASTER_KEY is not set. Generate one with `openssl rand -base64 32` and add it to .env.local and the deployment env (see .env.example).",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LEN) {
    throw new Error(
      `VAULT_MASTER_KEY must decode to exactly ${KEY_LEN} bytes; got ${key.length}. Use \`openssl rand -base64 32\`.`,
    );
  }
  return key;
}

/**
 * True if the master key is present and well-formed. Lets the UI show a
 * "not configured" hint instead of throwing on the first upload. Never reveals
 * the key itself.
 */
export function isVaultCryptoConfigured(): boolean {
  try {
    masterKey();
    return true;
  } catch {
    return false;
  }
}

/** Encrypt a plaintext buffer into an R2 blob + the wrapped key to persist. */
export function sealDocument(plaintext: Buffer): SealedDocument {
  const dek = randomBytes(KEY_LEN);
  try {
    // 1. Encrypt the file with the per-file DEK.
    const fileIv = randomBytes(IV_LEN);
    const fileCipher = createCipheriv(ALGO, dek, fileIv);
    const ciphertext = Buffer.concat([
      fileCipher.update(plaintext),
      fileCipher.final(),
    ]);
    const fileTag = fileCipher.getAuthTag();
    const blob = Buffer.concat([fileIv, fileTag, ciphertext]);

    // 2. Wrap the DEK under the master key.
    const keyIv = randomBytes(IV_LEN);
    const keyCipher = createCipheriv(ALGO, masterKey(), keyIv);
    const wrapped = Buffer.concat([keyCipher.update(dek), keyCipher.final()]);
    const keyTag = keyCipher.getAuthTag();

    return {
      blob,
      wrappedKey: wrapped.toString("base64"),
      keyIv: keyIv.toString("base64"),
      keyAuthTag: keyTag.toString("base64"),
    };
  } finally {
    // Best-effort scrub of the raw DEK from memory.
    dek.fill(0);
  }
}

/** Decrypt an R2 blob back to plaintext using its persisted wrapped key. */
export function openDocument(blob: Buffer, meta: WrappedKey): Buffer {
  // 1. Unwrap the DEK with the master key (throws on tamper / wrong key).
  const keyDecipher = createDecipheriv(
    ALGO,
    masterKey(),
    Buffer.from(meta.keyIv, "base64"),
  );
  keyDecipher.setAuthTag(Buffer.from(meta.keyAuthTag, "base64"));
  const dek = Buffer.concat([
    keyDecipher.update(Buffer.from(meta.wrappedKey, "base64")),
    keyDecipher.final(),
  ]);

  try {
    // 2. Split the self-describing blob and decrypt the file.
    const fileIv = blob.subarray(0, IV_LEN);
    const fileTag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ciphertext = blob.subarray(IV_LEN + TAG_LEN);
    const fileDecipher = createDecipheriv(ALGO, dek, fileIv);
    fileDecipher.setAuthTag(fileTag);
    return Buffer.concat([fileDecipher.update(ciphertext), fileDecipher.final()]);
  } finally {
    dek.fill(0);
  }
}

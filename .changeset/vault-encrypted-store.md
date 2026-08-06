---
type: feat
summary: Vault — a private, single-owner encrypted document store at /vault
---

A new vertical for sensitive documents (IDs, financial, medical, …). The one
part of OSM that is private by design.

**Security first (server-side envelope encryption):**

- Every file is AES-256-GCM encrypted **before** it reaches storage, with a
  random per-file data key that is itself wrapped by a master key
  (`VAULT_MASTER_KEY`) held only in the environment — never in this public repo.
  R2 holds only ciphertext (stored as opaque `application/octet-stream`); the DB
  holds only the *wrapped* key. A breach of either alone decrypts nothing, and
  GCM auth tags detect tampering. See `lib/vault/crypto.ts`.
- Ciphertext lives exclusively in the **private R2 bucket** (no public domain);
  nothing is ever `makePublic`'d. Uploads flow through the server (no presigned
  browser PUT) so encryption always happens first; downloads are decrypted
  server-side and streamed `no-store` as an attachment.
- The **strictest gate in the repo** (`lib/vault/access.ts`): locked to one
  `VAULT_OWNER_EMAIL` — not the whole `OWNER_EMAILS` allowlist. Everyone else,
  including other owners and signed-out visitors, gets a bare **404** (the vault
  never confirms it exists). Fail-closed if unset. Enforced in the layout, every
  server action, and both API routes. `robots: noindex`; deliberately absent
  from `siteNav`.

**Product:** drag-drop encrypted upload with title/category/tags, a document
grid, one-tap download, favorite, edit, delete, and **instant client-side fuzzy
search** (Fuse.js) across titles, tags, notes and filenames with match
highlighting.

**Design:** a new "Encrypted Archive / secure terminal" theme — graphite +
brass-gold with a verify-green signal, Chakra Petch / IBM Plex Sans / IBM Plex
Mono, a scanline console and unlock reveal. Both light + dark, WCAG-validated
(`docs/design/vault.md`).

New table `vault_documents` (metadata + wrapped key only). New env:
`VAULT_OWNER_EMAIL`, `VAULT_MASTER_KEY` (see `.env.example`).

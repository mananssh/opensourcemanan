# ADR 0016 — Object storage on Cloudflare R2 (S3-compatible), replacing GCS

**Status:** Accepted · 2026-07-07

## Context

[ADR 0009](./0009-shared-storage.md) established one shared object store for the
whole site: key-in-DB, per-vertical prefixes, owner-gated presigned uploads, and
per-object public/private access. It was implemented on Google Cloud Storage.

GCS bills egress, which is the dominant cost for a media-serving site, and the
service-account JSON is awkward to carry in env (multi-line `private_key`, base64
workarounds). Cloudflare R2 is S3-compatible, has **zero egress fees**, a usable
free tier, and a simple access-key credential model. Compute stays on Vercel;
this changes only the object-storage backend and the public asset host.

## Decision

**Move object storage to Cloudflare R2** (two buckets — a private default and a
public one, see below), spoken to via the AWS S3 SDK (`@aws-sdk/client-s3` +
`@aws-sdk/s3-request-presigner`) pointed at
`https://<account>.r2.cloudflarestorage.com` (region `auto`, path-style).

The public API in `lib/storage/` is unchanged, so **no consumer changed**:
`createUploadUrl`, `getReadUrl`, `deleteObject`, `makePublic`, `publicUrl`,
`isManagedKey`, `downloadText`, `uploadText`, and `StorageVertical` keep their
exact names and shapes. The module was renamed `gcs.ts` → `object-store.ts`
(provider-agnostic — the whole point of this ADR is that the backend is
swappable) and the ~20 import sites updated.

- **Presigned uploads/reads** map cleanly: `PutObjectCommand` (5-min expiry,
  content-type bound) and `GetObjectCommand` (default 3600s) via `getSignedUrl`.
- **`publicUrl(key)`** stays synchronous: `${R2_PUBLIC_BASE_URL}/${key}`, where
  `R2_PUBLIC_BASE_URL` is a **custom domain** bound to the public bucket.

### Two buckets, because R2 has no per-object ACL

The one thing that does NOT map from GCS is per-object public access. GCS made a
single object world-readable via an ACL flip on a private bucket. **R2 has no
per-object ACL** — public access is a bucket-level **custom-domain** binding, and
a custom domain serves the *entire* bucket by key. A single bucket + custom domain
would therefore expose every object at a guessable/derivable key — including
Sully's private prompts (stored at the documented key `misc/agent-prompts.json`,
ADR 0015) and gated `dump` images (whose signed-URL recipients could reconstruct a
permanent public URL). That silently breaks ADR 0009's private-by-default
guarantee.

So we keep the per-object model with **two buckets**:

- **Private bucket** (`R2_BUCKET`, no custom domain): every upload lands here;
  private/gated objects live only here and are read via signed `getReadUrl` URLs.
- **Public bucket** (`R2_PUBLIC_BUCKET`, bound to `R2_PUBLIC_BASE_URL`):
  `makePublic(key)` server-side **copies** the object here (`CopyObjectCommand`),
  then returns `publicUrl(key)`. `CopyObject` throws when the source is missing,
  which preserves the old GCS `makePublic` contract that `publishImage`/
  `publishAsset` rely on to abort a save when a browser upload silently failed.
  `deleteObject` removes the key from both buckets.

A private object is never reachable at a public URL — it simply isn't in the
public bucket. This preserves ADR 0009/0015 exactly, at the cost of a second
bucket, a copy-on-publish, and a two-bucket delete.

### Creds via env

`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
`R2_PUBLIC_BUCKET`, `R2_PUBLIC_BASE_URL` (`.env.local` + Vercel), never committed.
The client stays a **lazy singleton**, build-safe without creds.

## Alternatives considered

- **Single bucket + custom domain** (`makePublic` a no-op, publicUrl = domain+key):
  simplest and least code, but the custom domain serves the whole bucket, so the
  private agent prompts (at a documented key) and gated dump images would become
  anonymously fetchable. Rejected — it defeats ADR 0009/0015, the very guarantees
  the prompt-privacy work went out of its way to establish.
- **A Cloudflare Worker in front of R2** for prefix-based public rules — rejected;
  adds a runtime and deploy surface this migration explicitly keeps out of scope.
- **Stay on GCS** — rejected for egress cost and credential ergonomics.

## Consequences

- Depends on `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`;
  `@google-cloud/storage` removed.
- `next.config.ts` `images.remotePatterns` now points at the R2 custom-domain
  host (derived from `R2_PUBLIC_BASE_URL`).
- **DB stores keys, not URLs** (confirmed across `db/schema/*`), so a same-key
  copy of existing objects means **no DB migration**. A one-time, idempotent,
  dry-runnable copy script (`scripts/migrate-storage-to-r2.mjs`) moves existing
  GCS objects to R2 preserving keys: everything into the private bucket, and
  whatever was public in GCS (public ACL) also into the public bucket. Run
  manually with both sets of creds before cutting the public base URL over.
- `scripts/upload-prompts.mjs` (the private agent-prompt uploader, ADR 0015) now
  writes to R2 via the S3 SDK; the runtime loader path in `lib/agent/prompts.ts`
  is unchanged except for the storage import.

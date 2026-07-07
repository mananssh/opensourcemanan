---
type: refactor
summary: Move object storage from Google Cloud Storage to Cloudflare R2
---

Swaps the object-storage backend behind `lib/storage` from GCS to Cloudflare R2
(S3-compatible, zero egress). The public API is unchanged — `createUploadUrl`,
`getReadUrl`, `deleteObject`, `makePublic`, `publicUrl`, `isManagedKey`,
`downloadText`, `uploadText`, and `StorageVertical` keep their exact shapes, so
no consumer changed and the DB (which stores keys, not URLs) needs no migration.

The module is renamed `gcs.ts` → `object-store.ts` and uses the AWS S3 SDK against
the R2 endpoint. Because R2 has no per-object ACL, the per-object public/private
model (ADR 0009/0015) is kept with **two buckets**: a private default bucket for
every upload, and a public bucket (bound to the `R2_PUBLIC_BASE_URL` custom domain)
that `makePublic` copies objects into. Private objects — including Sully's prompts
and gated dump images — never enter the public bucket. Adds a dry-runnable,
idempotent `scripts/migrate-storage-to-r2.mjs` to copy existing objects preserving
keys (see ADR 0016).

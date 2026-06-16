# ADR 0009 — One shared GCS bucket, key-in-DB, presigned uploads

**Status:** Accepted · 2026-06-16

## Context

Features need to store images (blog covers, OG art, later project shots). We want
storage to be a shared primitive — like the DB and auth — not per-feature, and we
must not pass large blobs through serverless functions or make the bucket
publicly writable.

## Decision

**One Google Cloud Storage bucket (`opensourcemanan`)** for the whole site.

- **Key-in-DB.** Rows store the object **key** (e.g. `posts.coverImage`); the blob
  lives in GCS. `publicUrl(key)` builds the URL.
- **Per-vertical prefixes.** Keys are namespaced `<vertical>/<uuid>-<name>`
  (`blog/…`, `projects/…`, `misc/…`) so verticals share one bucket cleanly.
- **Presigned uploads, owner-gated.** `POST /api/storage/upload-url` checks
  `isOwner` and returns a presigned v4 PUT URL; the browser uploads straight to
  GCS. The bucket stays non-writable publicly and bytes skip the server.
- **Private bucket, per-object access (safe by default).** The bucket is **not**
  public. Objects are private by default and read via short-lived signed URLs
  (`getReadUrl`), issued server-side only to viewers who pass the owning record's
  visibility gate. An object is made world-readable only by an explicit
  `makePublic(key)` (public post covers, OG images → stable CDN URLs via
  `publicUrl`). This keeps one bucket safe for *every* vertical — a private
  vertical's files are never exposed by a blanket bucket policy, and gated
  content's images stay gated. (Requires fine-grained bucket ACLs, not uniform
  bucket-level access, so individual objects can be made public.)
- **Creds via env.** Service-account JSON in `GCP_SERVICE_ACCOUNT` (`.env.local`
  + Vercel), not Workload Identity Federation — simpler for a solo project. The
  client is a lazy singleton, build-safe without creds.

## Consequences

- `GCP_SERVICE_ACCOUNT` (+ optional `GCS_BUCKET`) required at runtime; never
  committed (`.env*` gitignored).
- Bucket stays private with fine-grained ACLs + a CORS rule allowing `PUT` from
  the site origins. No `allUsers` grant.
- A dedicated `media` table and an `<ImageUpload>` component arrive with the
  first consumer (the blog admin); v1 keeps keys on the owning row.
- Rejected: storing blobs in the DB (bloat) and uploads through the server
  (memory/time limits on serverless).

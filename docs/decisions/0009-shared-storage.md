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
- **Public-read serving.** Objects are public-read — fast, CDN-cacheable, and
  compatible with static/ISR rendering. (Trade-off: a known image URL is viewable
  even if its post is gated; accepted for v1, gated-image proxying deferred.)
- **Creds via env.** Service-account JSON in `GCP_SERVICE_ACCOUNT` (`.env.local`
  + Vercel), not Workload Identity Federation — simpler for a solo project. The
  client is a lazy singleton, build-safe without creds.

## Consequences

- `GCP_SERVICE_ACCOUNT` (+ optional `GCS_BUCKET`) required at runtime; never
  committed (`.env*` gitignored).
- Bucket needs public-read + a CORS rule allowing `PUT` from the site origins.
- A dedicated `media` table and an `<ImageUpload>` component arrive with the
  first consumer (the blog admin); v1 keeps keys on the owning row.
- Rejected: storing blobs in the DB (bloat) and uploads through the server
  (memory/time limits on serverless).

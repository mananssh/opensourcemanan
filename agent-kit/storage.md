# Storage — the shared object store

One Google Cloud Storage bucket (`opensourcemanan`) for the whole site. Images
and other assets live here; the **DB stores the object key**, never the blob.
Every vertical writes under its own prefix (`blog/…`, `projects/…`, `misc/…`).
See [ADR 0009](../docs/decisions/0009-shared-storage.md).

## The rule

- **Uploads go through a presigned URL** from the owner-gated endpoint
  `POST /api/storage/upload-url` — the browser PUTs the file straight to GCS, so
  bytes never pass through the server and the bucket is never publicly writable.
- **Persist the returned `key`** (e.g. `posts.coverImage`), not a full URL.
- **Access is per object, default private** (the bucket itself is NOT public):
  - **public** asset → `await makePublic(key)`, then render `publicUrl(key)`
    (stable, CDN-cacheable — use for public post covers, OG images).
  - **private** asset → render `await getReadUrl(key)` (short-lived signed URL),
    issued server-side only to viewers who pass the owning record's visibility
    gate. So gated content's images are gated too.
- Only the **owner** can obtain an upload URL (the endpoint checks `isOwner`).

## API (`lib/storage/gcs.ts`)

```ts
createUploadUrl({ vertical, filename, contentType }) // → { url, key }  (owner-gated; object is private)
makePublic(key)                                       // → publicUrl; world-readable (public assets)
publicUrl(key)                                        // → stable https URL (valid after makePublic)
getReadUrl(key, expiresInSeconds?)                    // → short-lived signed URL (private assets)
deleteObject(key)                                     // remove an object
```

`vertical` is one of `blog | projects | misc`. The client is a lazy singleton —
importing it is build-safe without credentials; it only throws when a call
actually needs GCS and `GCP_SERVICE_ACCOUNT` is unset.

## Upload flow (admin / authoring)

1. `POST /api/storage/upload-url` with `{ vertical, filename, contentType }`.
2. `PUT` the file to the returned `url` (with the same `Content-Type`).
3. Save the returned `key` on the owning DB row.
4. If the asset should be public, `await makePublic(key)`. Render `publicUrl(key)`
   for public assets, or `await getReadUrl(key)` for private/gated ones.

## Setup (one-time)

1. **Service account** with `Storage Object Admin` on the `opensourcemanan`
   bucket → create a JSON key.
2. Put the JSON (single line) in `GCP_SERVICE_ACCOUNT` — `.env.local` (dev) and
   Vercel (prod). Optionally set `GCS_BUCKET`.
3. **Keep the bucket private** — do **not** grant `allUsers`. Use **fine-grained**
   access control (not uniform bucket-level access) so individual objects can be
   made public via `makePublic`.
4. **CORS** on the bucket to allow browser `PUT` uploads:
   ```json
   [{ "origin": ["http://localhost:3000", "https://<your-domain>"],
      "method": ["PUT"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600 }]
   ```

`.env*` is gitignored — never commit the service-account JSON (see
[oss-safety.md](./oss-safety.md)).

> Safe by default: the bucket is private, so a private object is never readable
> without a signed URL. Only objects explicitly made public are world-readable.

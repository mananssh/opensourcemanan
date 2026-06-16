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
- **Render with `publicUrl(key)`** — objects are public-read (CDN-cacheable,
  works with static/ISR).
- Only the **owner** can obtain an upload URL (the endpoint checks `isOwner`).

## API (`lib/storage/gcs.ts`)

```ts
createUploadUrl({ vertical, filename, contentType }) // → { url, key, publicUrl }  (owner-gated caller)
publicUrl(key)                                        // → stable https URL
deleteObject(key)                                     // remove an object
```

`vertical` is one of `blog | projects | misc`. The client is a lazy singleton —
importing it is build-safe without credentials; it only throws when a call
actually needs GCS and `GCP_SERVICE_ACCOUNT` is unset.

## Upload flow (admin / authoring)

1. `POST /api/storage/upload-url` with `{ vertical, filename, contentType }`.
2. `PUT` the file to the returned `url` (with the same `Content-Type`).
3. Save the returned `key` on the owning DB row.
4. Render `publicUrl(key)`.

## Setup (one-time)

1. **Service account** with `Storage Object Admin` on the `opensourcemanan`
   bucket → create a JSON key.
2. Put the JSON (single line) in `GCP_SERVICE_ACCOUNT` — `.env.local` (dev) and
   Vercel (prod). Optionally set `GCS_BUCKET`.
3. **Make the bucket public-read** (e.g. grant `allUsers` the
   `Storage Object Viewer` role) so `publicUrl` works.
4. **CORS** on the bucket to allow browser `PUT` uploads:
   ```json
   [{ "origin": ["http://localhost:3000", "https://<your-domain>"],
      "method": ["PUT"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600 }]
   ```

`.env*` is gitignored — never commit the service-account JSON (see
[oss-safety.md](./oss-safety.md)).

> Public-read means a known image URL is viewable even if its post is gated.
> Accepted for v1; gated-image proxying can be added later.

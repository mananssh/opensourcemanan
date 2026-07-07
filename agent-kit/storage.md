# Storage — the shared object store

Object storage on Cloudflare R2 (S3-compatible) for the whole site. Images and
other assets live here; the **DB stores the object key**, never the blob. Every
vertical writes under its own prefix (`blog/…`, `projects/…`, `misc/…`). The app
talks to R2 through the S3 SDK pointed at the R2 endpoint. See
[ADR 0016](../docs/decisions/0016-r2-object-storage.md) (and
[ADR 0009](../docs/decisions/0009-shared-storage.md) for the per-object access
model this preserves).

## Two buckets (the key design point)

R2 has **no per-object ACL** — public access is a bucket-level custom-domain
binding, so a custom domain serves the *whole* bucket by key. To keep ADR 0009's
per-object public/private model with a real privacy boundary, we use **two
buckets**:

- **PRIVATE bucket** (`R2_BUCKET`, **no** custom domain): every upload lands here.
  Private/gated objects — Sully's prompts, `dump` images — live **only** here and
  are read via short-lived signed `getReadUrl` URLs. Not reachable at any public
  URL.
- **PUBLIC bucket** (`R2_PUBLIC_BUCKET`, bound to the `R2_PUBLIC_BASE_URL` custom
  domain): `makePublic(key)` **copies** an object here (server-side). Only objects
  copied here are world-readable; `publicUrl(key)` addresses them via the domain.

## The rule

- **Uploads go through a presigned URL** from the owner-gated endpoint
  `POST /api/storage/upload-url` — the browser PUTs the file straight to the
  private bucket, so bytes never pass through the server and the bucket is never
  publicly writable.
- **Persist the returned `key`** (e.g. `posts.coverImage`), not a full URL.
- **Access is per object, default private:**
  - **public** asset → `await makePublic(key)` (copies into the public bucket),
    then render `publicUrl(key)` (stable, CDN-cacheable — post covers, OG images).
  - **private** asset → render `await getReadUrl(key)` (short-lived signed URL from
    the private bucket), issued server-side only to viewers who pass the owning
    record's visibility gate. So gated content's images are gated too.
- Only the **owner** can obtain an upload URL (the endpoint checks `isOwner`).

## API (`lib/storage/object-store.ts`)

```ts
createUploadUrl({ vertical, filename, contentType }) // → { url, key }  (owner-gated; private bucket)
makePublic(key)                                       // → publicUrl; copies into the public bucket (throws if key missing)
publicUrl(key)                                        // → stable https URL via the R2 custom domain (sync)
getReadUrl(key, expiresInSeconds?)                    // → short-lived signed URL from the private bucket
deleteObject(key)                                     // remove from BOTH buckets (idempotent)
downloadText(key) / uploadText(key, text)             // small PRIVATE config objects (e.g. agent prompts)
```

`vertical` is one of `blog | dump | portfolio | projects | misc`. The client is a
lazy singleton — importing it is build-safe without credentials; it only throws
when a call actually needs R2 and the R2 env is unset.

## Upload flow (admin / authoring)

1. `POST /api/storage/upload-url` with `{ vertical, filename, contentType }`.
2. `PUT` the file to the returned `url` (with the same `Content-Type`).
3. Save the returned `key` on the owning DB row.
4. If the asset should be public, `await makePublic(key)` (copies it into the
   public bucket). Render `publicUrl(key)` for public assets, or
   `await getReadUrl(key)` for private/gated ones.

## Setup (one-time)

1. **Create two buckets** in the Cloudflare dashboard → R2:
   - `opensourcemanan` (private — the default; or set `R2_BUCKET`).
   - `opensourcemanan-public` (public — or set `R2_PUBLIC_BUCKET`).
2. **API token**: R2 → *Manage R2 API Tokens* → create a token scoped to
   **Object Read & Write** on **both** buckets. Put its Access Key ID / Secret
   Access Key and your account id in `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` /
   `R2_ACCOUNT_ID` — `.env.local` (dev) and Vercel (prod).
3. **Custom domain on the PUBLIC bucket only**: `opensourcemanan-public` → Settings
   → *Public access* → *Connect a custom domain* (e.g. `assets.<your-domain>`). Set
   `R2_PUBLIC_BASE_URL` to `https://<that-domain>` (no trailing slash); its
   hostname flows into `next.config.ts` `images.remotePatterns` automatically.
   **Do NOT** connect a custom domain (or enable the `*.r2.dev` URL) on the
   **private** bucket — that's what keeps prompts and gated images private.
4. **CORS** on the **private** bucket to allow browser `PUT` uploads:
   ```json
   [{ "AllowedOrigins": ["http://localhost:3000", "https://<your-domain>"],
      "AllowedMethods": ["PUT"], "AllowedHeaders": ["Content-Type"], "MaxAgeSeconds": 3600 }]
   ```

`.env*` is gitignored — never commit R2 credentials (see
[oss-safety.md](./oss-safety.md)).

## Migrating existing objects (GCS → R2)

`scripts/migrate-storage-to-r2.mjs` copies every object from the old GCS bucket to
R2 **preserving keys**, so DB-stored keys keep resolving with no DB migration.
Every object copies into the **private** bucket; objects that were **public** in
GCS (public ACL) also copy into the **public** bucket so their `publicUrl` keeps
resolving. It's idempotent (skips objects already present with the same size) and
dry-runnable:

```bash
node --env-file=.env scripts/migrate-storage-to-r2.mjs --dry-run   # list what would copy
node --env-file=.env scripts/migrate-storage-to-r2.mjs             # actually copy
```

It needs the old `GCP_SERVICE_ACCOUNT` (+ `GCS_BUCKET`) **and** the R2 env vars set
together for the one-time run (`@google-cloud/storage` is kept as a devDependency
only for this; it can be dropped afterward). Run it before cutting
`R2_PUBLIC_BASE_URL` over.

> Safe by default: private objects live only in the private bucket (no public
> domain) and are read solely through signed URLs — they are never reachable at a
> public URL. Only objects you `makePublic` are copied into the world-readable
> bucket.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

/**
 * Shared object-storage primitive on Cloudflare R2 (S3-compatible). Every vertical
 * writes under its own prefix (`blog/…`, `projects/…`, …); the DB stores the
 * returned object **key**, never a blob. This speaks the S3 SDK pointed at the
 * account's R2 endpoint (see ADR 0016).
 *
 * Access is per object, default private (ADR 0009). R2 has no per-object ACL —
 * public access is a bucket-level custom-domain binding — so we use TWO buckets
 * to keep the per-object model with a real privacy boundary:
 *   - PRIVATE bucket (`R2_BUCKET`, no public domain): every upload lands here;
 *     private/gated objects (prompts, dump images) live ONLY here and are read via
 *     short-lived signed `getReadUrl` URLs.
 *   - PUBLIC bucket (`R2_PUBLIC_BUCKET`, bound to the `R2_PUBLIC_BASE_URL` custom
 *     domain): `makePublic(key)` COPIES an object here; `publicUrl(key)` is then a
 *     stable, CDN-cacheable URL (post covers, OG images).
 *
 *   const { url, key } = await createUploadUrl({ vertical: "blog", filename, contentType });
 *   // browser PUTs the file to `url` (private bucket), then we persist `key`
 *   await makePublic(key);            // copies into the public bucket
 *   <img src={publicUrl(key)} />      // public (served from the public bucket's domain)
 *   <img src={await getReadUrl(key)} />  // private / gated (signed URL from the private bucket)
 *
 * A private object is never reachable at a public URL — it's simply not in the
 * public bucket. See agent-kit/storage.md and ADR 0016 for why two buckets (vs a
 * single bucket + custom domain, which would serve the whole bucket by key).
 *
 * Lazy singleton — importing this never connects or throws, so it's build-safe
 * without credentials; the first call that needs R2 throws if the R2 env is unset.
 */
const BUCKET = process.env.R2_BUCKET ?? "osmprivate";

/** Public bucket — bound to the R2 custom domain; only holds objects made public. */
const PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET ?? "opensourcemanan";

/** Stable public base URL — the R2 custom domain bound to the PUBLIC bucket (no trailing slash). */
const PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");

const globalForR2 = globalThis as unknown as { _r2?: S3Client };

function getClient(): S3Client {
  if (globalForR2._r2) return globalForR2._r2;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in .env.local (see .env.example) and the deployment environment.",
    );
  }
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    // R2 requires path-style addressing (no per-bucket virtual-hosted subdomains).
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  globalForR2._r2 = client;
  return client;
}

/** Allowed verticals — keeps keys namespaced and prevents path traversal. */
export type StorageVertical = "blog" | "dump" | "portfolio" | "projects" | "misc";

function buildKey(vertical: StorageVertical, filename: string): string {
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${vertical}/${randomUUID()}-${safe || "file"}`;
}

/**
 * Create a presigned PUT URL for a direct browser upload. Caller MUST be
 * owner-gated. The object is private until `makePublic` is called. Returns the
 * URL to PUT to and the object key to persist.
 */
export async function createUploadUrl(opts: {
  vertical: StorageVertical;
  filename: string;
  contentType: string;
}): Promise<{ url: string; key: string }> {
  const key = buildKey(opts.vertical, opts.filename);
  const url = await getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: opts.contentType }),
    // Short window: the URL only needs to live long enough for an in-editor
    // upload, so a leaked URL is writable for minutes, not a quarter hour.
    { expiresIn: 5 * 60 }, // 5 minutes
  );
  return { url, key };
}

/** Object-key prefixes we ever mint — used to validate client-supplied keys. */
const KEY_PREFIX_RE = /^(blog|dump|portfolio|projects|misc)\/[a-z0-9][a-z0-9./-]*$/;

/** True if `key` looks like a key we minted (no traversal, known vertical). */
export function isManagedKey(key: string): boolean {
  return KEY_PREFIX_RE.test(key) && !key.includes("..");
}

/**
 * Make an object world-readable by copying it from the private bucket into the
 * public bucket (which is bound to the `R2_PUBLIC_BASE_URL` custom domain), then
 * returning its public URL. Server-side copy — bytes never round-trip through us.
 *
 * `CopyObject` THROWS if the source object doesn't exist, preserving the old GCS
 * contract two callers (`publishImage`, `publishAsset`) rely on to abort a save
 * when a browser upload silently failed rather than persist a key to a missing
 * object. Same async signature as before, so no caller changes (see ADR 0016).
 */
export async function makePublic(key: string): Promise<string> {
  await getClient().send(
    new CopyObjectCommand({
      Bucket: PUBLIC_BUCKET,
      Key: key,
      // CopySource is `<bucket>/<key>`, URL-encoded (keys contain `/` and `-`).
      CopySource: encodeURI(`${BUCKET}/${key}`),
    }),
  );
  return publicUrl(key);
}

/** Stable public URL via the R2 custom domain — valid after `makePublic(key)`. */
export function publicUrl(key: string): string {
  return `${PUBLIC_BASE_URL}/${key}`;
}

/**
 * Short-lived signed read URL for a PRIVATE object. Generate server-side and
 * only hand to viewers who pass the owning record's visibility gate.
 */
export async function getReadUrl(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

/** Delete an object by key from BOTH buckets (e.g. when a post's cover changes). */
export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  // R2/S3 DeleteObject is idempotent — deleting a missing key is not an error.
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  // Also drop any public copy. Best-effort: the object may never have been made
  // public, and cleaning up the CDN copy must not fail the primary delete.
  try {
    await client.send(new DeleteObjectCommand({ Bucket: PUBLIC_BUCKET, Key: key }));
  } catch {
    /* public copy absent or public bucket unconfigured — ignore */
  }
}

/**
 * Read a PRIVATE object's contents as a UTF-8 string, server-side via the
 * bucket credentials (never a public URL). For small config-style objects — e.g.
 * the owner's agent prompts — not user media. Throws if the object is missing
 * or R2 is unreachable; callers should fall back rather than fail hard.
 */
export async function downloadText(key: string): Promise<string> {
  const res = await getClient().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  // The AWS SDK's Body is a stream in Node; transformToString collapses it.
  return (await res.Body!.transformToString("utf-8")) ?? "";
}

/** Upload a UTF-8 string to a key as a PRIVATE object (no makePublic). */
export async function uploadText(key: string, text: string, contentType = "application/json"): Promise<void> {
  await getClient().send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: text, ContentType: contentType }),
  );
}

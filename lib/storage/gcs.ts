import { Storage } from "@google-cloud/storage";
import { randomUUID } from "node:crypto";

/**
 * Shared object-storage primitive — one GCS bucket for the whole site. Every
 * vertical writes under its own prefix (`blog/…`, later `projects/…`); the DB
 * stores the returned object **key**, never a blob.
 *
 * Access is decided PER OBJECT, not per bucket (ADR 0009). The bucket is private
 * (no public access); objects are private by default:
 *   - private (default) → read via `getReadUrl(key)` (short-lived signed URL,
 *     issued server-side only to authorized viewers — respects visibility).
 *   - public (opt-in)   → call `makePublic(key)`; then `publicUrl(key)` is a
 *     stable, CDN-cacheable URL (post covers, OG images).
 *
 *   const { url, key } = await createUploadUrl({ vertical: "blog", filename, contentType });
 *   // browser PUTs the file to `url`, then we persist `key`
 *   await makePublic(key);            // for public assets
 *   <img src={publicUrl(key)} />      // public
 *   <img src={await getReadUrl(key)} />  // private / gated
 *
 * Lazy singleton — importing this never connects or throws, so it's build-safe
 * without credentials; the first call that needs GCS throws if GCP_SERVICE_ACCOUNT
 * is unset. See agent-kit/storage.md.
 */
const BUCKET = process.env.GCS_BUCKET ?? "opensourcemanan";

const globalForGcs = globalThis as unknown as { _gcs?: Storage };

function getStorage(): Storage {
  if (globalForGcs._gcs) return globalForGcs._gcs;
  const raw = process.env.GCP_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "GCP_SERVICE_ACCOUNT is not set. Add the service-account JSON to .env.local (see .env.example) and the deployment environment.",
    );
  }
  let sa: { project_id?: string; client_email?: string; private_key?: string };
  try {
    sa = JSON.parse(raw);
  } catch {
    throw new Error("GCP_SERVICE_ACCOUNT must be valid service-account JSON.");
  }
  const storage = new Storage({
    projectId: sa.project_id,
    credentials: { client_email: sa.client_email, private_key: sa.private_key },
  });
  globalForGcs._gcs = storage;
  return storage;
}

/** Allowed verticals — keeps keys namespaced and prevents path traversal. */
export type StorageVertical = "blog" | "projects" | "misc";

function buildKey(vertical: StorageVertical, filename: string): string {
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${vertical}/${randomUUID()}-${safe || "file"}`;
}

/**
 * Create a presigned v4 PUT URL for a direct browser upload. Caller MUST be
 * owner-gated. The object is private until `makePublic` is called. Returns the
 * URL to PUT to and the object key to persist.
 */
export async function createUploadUrl(opts: {
  vertical: StorageVertical;
  filename: string;
  contentType: string;
}): Promise<{ url: string; key: string }> {
  const key = buildKey(opts.vertical, opts.filename);
  const [url] = await getStorage()
    .bucket(BUCKET)
    .file(key)
    .getSignedUrl({
      version: "v4",
      action: "write",
      // Short window: the URL only needs to live long enough for an in-editor
      // upload, so a leaked URL is writable for minutes, not a quarter hour.
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      contentType: opts.contentType,
    });
  return { url, key };
}

/** Object-key prefixes we ever mint — used to validate client-supplied keys. */
const KEY_PREFIX_RE = /^(blog|projects|misc)\/[a-z0-9][a-z0-9./-]*$/;

/** True if `key` looks like a key we minted (no traversal, known vertical). */
export function isManagedKey(key: string): boolean {
  return KEY_PREFIX_RE.test(key) && !key.includes("..");
}

/** Make an object world-readable (for public assets). Returns its public URL. */
export async function makePublic(key: string): Promise<string> {
  await getStorage().bucket(BUCKET).file(key).makePublic();
  return publicUrl(key);
}

/** Stable public URL — only valid after `makePublic(key)`. */
export function publicUrl(key: string): string {
  return `https://storage.googleapis.com/${BUCKET}/${key}`;
}

/**
 * Short-lived signed read URL for a PRIVATE object. Generate server-side and
 * only hand to viewers who pass the owning record's visibility gate.
 */
export async function getReadUrl(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const [url] = await getStorage()
    .bucket(BUCKET)
    .file(key)
    .getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + expiresInSeconds * 1000,
    });
  return url;
}

/** Delete an object by key (e.g. when a post's cover image changes). */
export async function deleteObject(key: string): Promise<void> {
  await getStorage().bucket(BUCKET).file(key).delete({ ignoreNotFound: true });
}

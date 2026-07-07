#!/usr/bin/env node
/**
 * One-time data migration: copy every object from the old Google Cloud Storage
 * bucket to the new Cloudflare R2 bucket, PRESERVING KEYS.
 *
 *   node --env-file=.env scripts/migrate-storage-to-r2.mjs --dry-run   # list only
 *   node --env-file=.env scripts/migrate-storage-to-r2.mjs             # copy
 *
 * The DB stores object KEYS, not URLs (see db/schema/*), so a same-key copy means
 * NO DB migration is needed — every stored key resolves against R2 afterward.
 *
 * Two-bucket model (ADR 0016): every object copies into the PRIVATE bucket
 * (R2_BUCKET). Objects that were PUBLIC in GCS (public ACL) ALSO copy into the
 * PUBLIC bucket (R2_PUBLIC_BUCKET, the one bound to the custom domain), so their
 * publicUrl keeps resolving. Private objects never enter the public bucket.
 *
 * Idempotent: an object already present in the target bucket with the same byte
 * size is skipped, so the script is safe to re-run and to resume after a stop.
 *
 * Needs BOTH sets of creds set together for this run:
 *   - GCS (source):   GCP_SERVICE_ACCOUNT (+ optional GCS_BUCKET)
 *   - R2  (dest):     R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (+ optional R2_BUCKET)
 *
 * @google-cloud/storage is a devDependency kept only for this migration; it can
 * be dropped once the copy is done and verified. Nothing at runtime imports it.
 */
import { Storage } from "@google-cloud/storage";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const DRY_RUN = process.argv.includes("--dry-run");

const GCS_BUCKET = process.env.GCS_BUCKET ?? "opensourcemanan";
const R2_BUCKET = process.env.R2_BUCKET ?? "osmprivate";
const R2_PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET ?? "opensourcemanan";

// --- source: GCS ---
const saRaw = process.env.GCP_SERVICE_ACCOUNT;
if (!saRaw) {
  console.error("✗ GCP_SERVICE_ACCOUNT is not set (the migration source). Add it to .env — see .env.example history.");
  process.exit(1);
}
const sa = (() => {
  const t = saRaw.trim();
  if (t.startsWith("{")) return JSON.parse(t);
  return JSON.parse(Buffer.from(saRaw, "base64").toString("utf8"));
})();
const gcs = new Storage({
  projectId: sa.project_id,
  credentials: { client_email: sa.client_email, private_key: sa.private_key },
});

// --- dest: R2 ---
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error("✗ R2 creds missing (the migration dest). Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY — see .env.example.");
  process.exit(1);
}
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

/** Does the target R2 bucket already have this key with the same byte size? */
async function alreadyCopied(bucket, key, size) {
  try {
    const head = await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return String(head.ContentLength) === String(size);
  } catch {
    return false; // not found (or head denied) → treat as needs-copy
  }
}

async function main() {
  console.log(
    `${DRY_RUN ? "[dry-run] " : ""}Copying gs://${GCS_BUCKET}/* → r2://${R2_BUCKET} (private) + r2://${R2_PUBLIC_BUCKET} (public copies), keys preserved\n`,
  );

  let copied = 0;
  let publicCopied = 0;
  let skipped = 0;
  let failed = 0;
  let total = 0;

  const [files] = await gcs.bucket(GCS_BUCKET).getFiles();
  for (const file of files) {
    total += 1;
    const key = file.name;
    const size = file.metadata?.size ?? 0;
    const contentType = file.metadata?.contentType ?? "application/octet-stream";

    // Was this object public in GCS? Public ones must also land in the public bucket.
    let isPublic = false;
    try {
      [isPublic] = await file.isPublic();
    } catch {
      isPublic = false; // ACL unreadable → treat as private (safe default)
    }

    // Copy the bytes into the private bucket (the source of truth for every object).
    const needsPrivate = !(await alreadyCopied(R2_BUCKET, key, size));
    // Copy into the public bucket too, but only if it was public in GCS.
    const needsPublic = isPublic && !(await alreadyCopied(R2_PUBLIC_BUCKET, key, size));

    if (!needsPrivate && !needsPublic) {
      skipped += 1;
      console.log(`  skip   ${key} (already present, ${size} bytes${isPublic ? ", public" : ""})`);
      continue;
    }

    if (DRY_RUN) {
      if (needsPrivate) copied += 1;
      if (needsPublic) publicCopied += 1;
      console.log(
        `  would  ${key} (${size} bytes, ${contentType})${needsPrivate ? " →private" : ""}${needsPublic ? " →public" : ""}`,
      );
      continue;
    }

    try {
      const [buf] = await file.download();
      if (needsPrivate) {
        await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buf, ContentType: contentType }));
        copied += 1;
      }
      if (needsPublic) {
        await r2.send(new PutObjectCommand({ Bucket: R2_PUBLIC_BUCKET, Key: key, Body: buf, ContentType: contentType }));
        publicCopied += 1;
      }
      console.log(`  copy   ${key} (${size} bytes${isPublic ? ", public" : ""})`);
    } catch (e) {
      failed += 1;
      console.error(`  FAIL   ${key}: ${e.message}`);
    }
  }

  console.log(
    `\n${DRY_RUN ? "[dry-run] " : ""}Done. ${total} object(s): ${copied} ${DRY_RUN ? "to copy" : "copied"} to private, ${publicCopied} to public, ${skipped} skipped, ${failed} failed.`,
  );
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error("✗ Migration error:", e.message);
  process.exit(1);
});

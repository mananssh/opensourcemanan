import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { vaultDocuments } from "@/db/schema";
import {
  buildStorageKey,
  putObject,
  deleteObject,
} from "@/lib/storage/object-store";
import { vaultOwnerOrNull } from "@/lib/vault/access";
import { sealDocument, isVaultCryptoConfigured } from "@/lib/vault/crypto";
import { normalizeCategory } from "@/lib/vault/categories";

// Reads/writes R2 + Node crypto — must run on the Node runtime, not the edge.
export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_TITLE = 200;
const MAX_NOTES = 2000;

// The document types the vault accepts. The R2 object is stored as opaque
// ciphertext regardless; this just keeps uploads to sane, expected formats.
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/avif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

/** Bare 404 — the vault must never confirm its own existence to a non-owner. */
function notFound() {
  return new NextResponse(null, { status: 404 });
}

/**
 * Encrypted upload. The bytes flow THROUGH the server so we can envelope-encrypt
 * before anything reaches R2 — there is no presigned browser PUT here (that would
 * put plaintext in the bucket). Owner-gated; 404 for everyone else.
 */
export async function POST(request: Request) {
  const session = await vaultOwnerOrNull();
  if (!session) return notFound();

  if (!isVaultCryptoConfigured()) {
    return NextResponse.json(
      { error: "Vault encryption key is not configured (VAULT_MASTER_KEY)." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File is larger than the 25 MB limit." },
      { status: 413 },
    );
  }
  const contentType = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${contentType || "unknown"}.` },
      { status: 415 },
    );
  }

  const rawTitle = (form.get("title") as string | null)?.trim();
  const title = (rawTitle || file.name).slice(0, MAX_TITLE);
  const category = normalizeCategory(form.get("category"));
  const notes =
    ((form.get("notes") as string | null)?.trim().slice(0, MAX_NOTES) || null);
  const tags = String(form.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().slice(0, 32))
    .filter(Boolean)
    .slice(0, 12);

  // Encrypt in memory, then store only ciphertext (opaque content-type so even
  // the object metadata doesn't leak what kind of document it is).
  const plaintext = Buffer.from(await file.arrayBuffer());
  const sealed = sealDocument(plaintext);
  const key = buildStorageKey("vault", file.name);

  try {
    await putObject(key, sealed.blob, "application/octet-stream");
  } catch {
    return NextResponse.json(
      { error: "Storage is not reachable. Check R2 configuration." },
      { status: 502 },
    );
  }

  try {
    const [row] = await db
      .insert(vaultDocuments)
      .values({
        title,
        category,
        tags,
        notes,
        originalFilename: file.name.slice(0, 255),
        contentType,
        sizeBytes: file.size,
        storageKey: key,
        wrappedKey: sealed.wrappedKey,
        keyIv: sealed.keyIv,
        keyAuthTag: sealed.keyAuthTag,
      })
      .returning({ id: vaultDocuments.id });
    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch {
    // Don't orphan the ciphertext if the row insert failed — best-effort remove.
    await deleteObject(key).catch(() => {});
    return NextResponse.json(
      { error: "Couldn't save the document record." },
      { status: 500 },
    );
  }
}

import { getObjectBuffer } from "@/lib/storage/object-store";
import { vaultOwnerOrNull } from "@/lib/vault/access";
import { openDocument } from "@/lib/vault/crypto";
import { getDocumentRecord } from "@/lib/vault/queries";

// Fetches ciphertext from R2 + decrypts with Node crypto — Node runtime only.
export const runtime = "nodejs";

/** Bare 404 for anyone who isn't the vault owner (never confirm existence). */
function notFound() {
  return new Response(null, { status: 404 });
}

/**
 * Decrypt-and-serve. Gate → fetch ciphertext → decrypt in memory → stream the
 * plaintext back. Never a public/signed URL to the object (that would only ever
 * hand out ciphertext anyway); always server-mediated so the auth check and the
 * decryption happen together. `?inline=1` serves inline (for in-app preview);
 * default is a download attachment. Always `no-store`.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await vaultOwnerOrNull();
  if (!session) return notFound();

  const { id } = await params;
  const row = await getDocumentRecord(id);
  if (!row) return notFound();

  let plaintext: Buffer;
  try {
    const blob = await getObjectBuffer(row.storageKey);
    plaintext = openDocument(blob, row);
  } catch {
    // Object missing, R2 down, or auth-tag/master-key mismatch (tamper).
    return new Response(null, { status: 502 });
  }

  const inline = new URL(request.url).searchParams.get("inline") === "1";
  // RFC 5987 encoding so unicode / spaces in the filename survive the header.
  const encoded = encodeURIComponent(row.originalFilename).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  const disposition = `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encoded}`;

  return new Response(new Uint8Array(plaintext), {
    headers: {
      "Content-Type": row.contentType,
      "Content-Disposition": disposition,
      "Content-Length": String(plaintext.length),
      // Never let a decrypted document sit in any cache.
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

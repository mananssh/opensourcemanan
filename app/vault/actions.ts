"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { vaultDocuments } from "@/db/schema";
import { deleteObject } from "@/lib/storage/object-store";
import { requireVaultOwner } from "@/lib/vault/access";
import { getDocumentRecord } from "@/lib/vault/queries";
import { normalizeCategory } from "@/lib/vault/categories";

/**
 * Vault mutations. EVERY action re-gates with `requireVaultOwner()` (404s anyone
 * but the single owner) — never trust that the page guard ran. Uploads are the
 * one write that goes through an API route instead (it handles file bytes +
 * encryption); see app/api/vault/upload/route.ts.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_TITLE = 200;
const MAX_NOTES = 2000;
const MAX_TAGS = 12;
const MAX_TAG_LEN = 32;

function cleanTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    if (typeof t !== "string") continue;
    const tag = t.trim().slice(0, MAX_TAG_LEN);
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      out.push(tag);
    }
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

export async function updateDocument(
  id: string,
  patch: {
    title?: string;
    category?: string;
    tags?: string[];
    notes?: string | null;
  },
): Promise<ActionResult> {
  await requireVaultOwner();
  const title = patch.title?.trim().slice(0, MAX_TITLE);
  if (patch.title !== undefined && !title) {
    return { ok: false, error: "Title can't be empty." };
  }
  const notes =
    patch.notes === undefined
      ? undefined
      : (patch.notes?.trim().slice(0, MAX_NOTES) || null);

  try {
    await db
      .update(vaultDocuments)
      .set({
        ...(title !== undefined ? { title } : {}),
        ...(patch.category !== undefined
          ? { category: normalizeCategory(patch.category) }
          : {}),
        ...(patch.tags !== undefined ? { tags: cleanTags(patch.tags) } : {}),
        ...(notes !== undefined ? { notes } : {}),
        updatedAt: new Date(),
      })
      .where(eq(vaultDocuments.id, id));
    revalidatePath("/vault");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save changes. Try again." };
  }
}

export async function toggleFavorite(
  id: string,
  favorite: boolean,
): Promise<ActionResult> {
  await requireVaultOwner();
  try {
    await db
      .update(vaultDocuments)
      .set({ favorite, updatedAt: new Date() })
      .where(eq(vaultDocuments.id, id));
    revalidatePath("/vault");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update. Try again." };
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  await requireVaultOwner();
  const row = await getDocumentRecord(id);
  if (!row) return { ok: false, error: "Document not found." };
  try {
    // Drop the row first so a stuck object never blocks removing the record;
    // then best-effort delete the ciphertext from R2.
    await db.delete(vaultDocuments).where(eq(vaultDocuments.id, id));
    await deleteObject(row.storageKey).catch(() => {
      /* object already gone / R2 hiccup — the row is what the UI reads */
    });
    revalidatePath("/vault");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't delete. Try again." };
  }
}

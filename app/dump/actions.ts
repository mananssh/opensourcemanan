"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { thoughts } from "@/db/schema";
import { requireOwner } from "@/lib/auth";

export type DumpState = { error?: string; ok?: boolean };

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function revalidateDump(): void {
  revalidatePath("/dump", "layout");
}

/** Create a thought (owner only). Image is uploaded client-side; we store its key. */
export async function createThought(
  _prev: DumpState,
  formData: FormData,
): Promise<DumpState> {
  await requireOwner();
  const body = str(formData, "body").slice(0, 4000);
  const imageKey = str(formData, "imageKey") || null;
  if (!body && !imageKey) {
    return { error: "Write something or attach an image." };
  }
  const visibility = str(formData, "visibility") === "public" ? "public" : "private";
  await db.insert(thoughts).values({ body, imageKey, visibility });
  revalidateDump();
  return { ok: true };
}

/** Soft-delete a thought (owner only; recoverable). */
export async function deleteThought(formData: FormData): Promise<void> {
  await requireOwner();
  const id = str(formData, "id");
  if (id) {
    await db
      .update(thoughts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(thoughts.id, id));
  }
  revalidateDump();
}

/** Flip a thought between public and private (owner only). */
export async function toggleThoughtVisibility(formData: FormData): Promise<void> {
  await requireOwner();
  const id = str(formData, "id");
  if (!id) return;
  const [row] = await db
    .select({ visibility: thoughts.visibility })
    .from(thoughts)
    .where(eq(thoughts.id, id))
    .limit(1);
  if (row) {
    await db
      .update(thoughts)
      .set({
        visibility: row.visibility === "public" ? "private" : "public",
        updatedAt: new Date(),
      })
      .where(eq(thoughts.id, id));
  }
  revalidateDump();
}

/** Pin/unpin a thought to the top of the wall (owner only). */
export async function togglePinned(formData: FormData): Promise<void> {
  await requireOwner();
  const id = str(formData, "id");
  if (!id) return;
  const [row] = await db
    .select({ pinned: thoughts.pinned })
    .from(thoughts)
    .where(eq(thoughts.id, id))
    .limit(1);
  if (row) {
    await db
      .update(thoughts)
      .set({ pinned: !row.pinned, updatedAt: new Date() })
      .where(eq(thoughts.id, id));
  }
  revalidateDump();
}

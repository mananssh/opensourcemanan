"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import GithubSlugger from "github-slugger";
import { db } from "@/db/client";
import { posts, categories, tags, postTags, comments } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { readingMinutes } from "@/lib/blog/reading-time";
import { makePublic, deleteObject } from "@/lib/storage/gcs";

type Visibility = "public" | "authed" | "allowlist" | "owner";

/** Result of a form action — `{ error }` is surfaced inline via useActionState. */
export type ActionState = { error?: string };

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function emailList(fd: FormData, key: string): string[] {
  return str(fd, key)
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function slugify(s: string): string {
  return new GithubSlugger().slug(s);
}

/** Postgres unique_violation anywhere in the error cause chain. */
function isUniqueViolation(e: unknown): boolean {
  let cur: unknown = e;
  for (let i = 0; i < 5 && cur; i++) {
    const o = cur as { code?: unknown; cause?: unknown };
    if (o.code === "23505") return true;
    cur = o.cause;
  }
  return false;
}

/**
 * Resolve a free slug. If `base` is taken: when the owner typed it explicitly we
 * return null (caller surfaces an error so they can change it); otherwise it was
 * auto-derived, so we disambiguate with -2, -3, … and never lose their work.
 */
async function freeSlug(
  base: string,
  explicit: boolean,
  exists: (slug: string) => Promise<boolean>,
): Promise<string | null> {
  if (!(await exists(base))) return base;
  if (explicit) return null;
  for (let n = 2; n < 100; n++) {
    const cand = `${base}-${n}`;
    if (!(await exists(cand))) return cand;
  }
  return null;
}

/** Cover/category images are public; make the uploaded object world-readable. */
async function publishImage(key: string | null): Promise<void> {
  if (!key) return;
  await makePublic(key); // throws on failure — caller aborts the save
}

function revalidateBlog(): void {
  revalidatePath("/blog", "layout");
  revalidatePath("/blog/admin", "layout");
}

export async function savePost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();
  const id = str(formData, "id");
  const title = str(formData, "title");
  if (!title) return { error: "Title is required." };
  const bodyMdx =
    typeof formData.get("bodyMdx") === "string"
      ? (formData.get("bodyMdx") as string)
      : "";
  const newCoverKey = str(formData, "coverImageKey") || null;

  const explicitSlug = str(formData, "slug");
  const base = slugify(explicitSlug || title);
  const slug = await freeSlug(base, Boolean(explicitSlug), async (s) => {
    const [r] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.slug, s), id ? ne(posts.id, id) : undefined))
      .limit(1);
    return Boolean(r);
  });
  if (!slug) {
    return { error: `The slug "${base}" is already taken — choose another.` };
  }

  try {
    await publishImage(newCoverKey);
  } catch {
    return { error: "Couldn't process the cover image. Please try again." };
  }

  // Load existing publish date + prior cover (for orphan cleanup) up front.
  let oldCoverKey: string | null = null;
  let existingPublishedAt: Date | null = null;
  if (id) {
    const [existing] = await db
      .select({ publishedAt: posts.publishedAt, coverImageKey: posts.coverImageKey })
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);
    oldCoverKey = existing?.coverImageKey ?? null;
    existingPublishedAt = existing?.publishedAt ?? null;
  }

  const status = (str(formData, "status") || "draft") as "draft" | "published";
  // Optional scheduled publish date (datetime-local). A future date with status
  // "published" keeps the post hidden until then.
  const publishInput = str(formData, "publishedAt");
  const scheduledAt = publishInput ? new Date(publishInput) : null;
  const publishedAt =
    status === "published"
      ? (scheduledAt ?? existingPublishedAt ?? new Date())
      : (scheduledAt ?? existingPublishedAt);

  const data = {
    title,
    slug,
    excerpt: str(formData, "excerpt") || null,
    bodyMdx,
    categoryId: str(formData, "categoryId") || null,
    visibility: (str(formData, "visibility") || "public") as Visibility,
    allowedEmails: emailList(formData, "allowedEmails"),
    status,
    featured: formData.get("featured") === "on",
    coverImageKey: newCoverKey,
    metaTitle: str(formData, "metaTitle") || null,
    metaDescription: str(formData, "metaDescription") || null,
    readingMinutes: readingMinutes(bodyMdx),
    publishedAt,
    updatedAt: new Date(),
  };

  const tagNames = str(formData, "tags")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Post write + tag rewrite are one transaction so a mid-write failure can't
  // leave the post with its tags deleted and not re-linked.
  try {
    await db.transaction(async (tx) => {
      let postId = id;
      if (id) {
        await tx.update(posts).set(data).where(eq(posts.id, id));
      } else {
        const [row] = await tx
          .insert(posts)
          .values(data)
          .returning({ id: posts.id });
        postId = row.id;
      }

      const unique = [...new Set(tagNames)];
      await tx.delete(postTags).where(eq(postTags.postId, postId));
      if (unique.length > 0) {
        const tagIds: string[] = [];
        for (const name of unique) {
          const [tag] = await tx
            .insert(tags)
            .values({ slug: slugify(name), name })
            .onConflictDoUpdate({ target: tags.slug, set: { name } })
            .returning({ id: tags.id });
          tagIds.push(tag.id);
        }
        await tx.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
      }
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { error: "That slug was just taken — try a different one." };
    }
    throw e;
  }

  if (oldCoverKey && oldCoverKey !== newCoverKey) {
    await deleteObject(oldCoverKey).catch(() => {});
  }

  revalidateBlog();
  redirect("/blog/admin");
}

export async function deletePost(formData: FormData): Promise<void> {
  await requireOwner();
  const id = str(formData, "id");
  // Soft delete — recoverable, and keeps comments/reactions/views intact. The
  // cover image is retained too (restoring brings it back).
  if (id) {
    await db
      .update(posts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(posts.id, id));
  }
  revalidateBlog();
  redirect("/blog/admin");
}

export async function togglePublish(formData: FormData): Promise<void> {
  await requireOwner();
  const id = str(formData, "id");
  const [row] = await db
    .select({ status: posts.status, publishedAt: posts.publishedAt })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  if (row) {
    const next = row.status === "published" ? "draft" : "published";
    await db
      .update(posts)
      .set({
        status: next,
        publishedAt: next === "published" ? (row.publishedAt ?? new Date()) : row.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id));
  }
  revalidateBlog();
  redirect("/blog/admin");
}

export async function saveCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireOwner();
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!name) return { error: "Name is required." };
  const newCoverKey = str(formData, "coverImageKey") || null;

  const explicitSlug = str(formData, "slug");
  const base = slugify(explicitSlug || name);
  const slug = await freeSlug(base, Boolean(explicitSlug), async (s) => {
    const [r] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.slug, s), id ? ne(categories.id, id) : undefined))
      .limit(1);
    return Boolean(r);
  });
  if (!slug) {
    return { error: `The slug "${base}" is already taken — choose another.` };
  }

  try {
    await publishImage(newCoverKey);
  } catch {
    return { error: "Couldn't process the tile image. Please try again." };
  }

  let oldCoverKey: string | null = null;
  if (id) {
    const [existing] = await db
      .select({ coverImageKey: categories.coverImageKey })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    oldCoverKey = existing?.coverImageKey ?? null;
  }

  const data = {
    name,
    slug,
    description: str(formData, "description") || null,
    accentColor: str(formData, "accentColor") || "#3b3b3b",
    coverImageKey: newCoverKey,
    visibility: (str(formData, "visibility") || "public") as Visibility,
    allowedEmails: emailList(formData, "allowedEmails"),
    sortOrder: Number(str(formData, "sortOrder")) || 0,
    updatedAt: new Date(),
  };

  try {
    if (id) await db.update(categories).set(data).where(eq(categories.id, id));
    else await db.insert(categories).values(data);
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { error: "That slug was just taken — try a different one." };
    }
    throw e;
  }

  if (oldCoverKey && oldCoverKey !== newCoverKey) {
    await deleteObject(oldCoverKey).catch(() => {});
  }

  revalidateBlog();
  redirect("/blog/admin");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireOwner();
  const id = str(formData, "id");
  if (id) {
    const [row] = await db
      .select({ coverImageKey: categories.coverImageKey })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    await db.delete(categories).where(eq(categories.id, id));
    if (row?.coverImageKey) await deleteObject(row.coverImageKey).catch(() => {});
  }
  revalidateBlog();
  redirect("/blog/admin");
}

export async function deleteComment(formData: FormData): Promise<void> {
  await requireOwner();
  const id = str(formData, "id");
  if (id) await db.delete(comments).where(eq(comments.id, id));
  revalidateBlog();
  redirect("/blog/admin");
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import GithubSlugger from "github-slugger";
import { db } from "@/db/client";
import { posts, categories, tags, postTags } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { readingMinutes } from "@/lib/blog/reading-time";
import { makePublic } from "@/lib/storage/gcs";

type Visibility = "public" | "authed" | "allowlist" | "owner";

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

/** Cover/category images are public; make the uploaded object world-readable. */
async function publishImage(key: string | null): Promise<void> {
  if (!key) return;
  try {
    await makePublic(key);
  } catch (e) {
    console.error("[admin] makePublic failed for", key, e);
  }
}

function revalidateBlog(): void {
  revalidatePath("/blog", "layout");
  revalidatePath("/blog/admin", "layout");
}

/** Replace a post's tags: upsert each tag by slug, then rewrite the links. */
async function syncPostTags(postId: string, names: string[]): Promise<void> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  await db.delete(postTags).where(eq(postTags.postId, postId));
  if (unique.length === 0) return;
  const tagIds: string[] = [];
  for (const name of unique) {
    const [tag] = await db
      .insert(tags)
      .values({ slug: slugify(name), name })
      .onConflictDoUpdate({ target: tags.slug, set: { name } })
      .returning({ id: tags.id });
    tagIds.push(tag.id);
  }
  await db.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
}

export async function savePost(formData: FormData): Promise<void> {
  await requireOwner();
  const id = str(formData, "id");
  const title = str(formData, "title");
  const bodyMdx = typeof formData.get("bodyMdx") === "string" ? (formData.get("bodyMdx") as string) : "";
  const coverImageKey = str(formData, "coverImageKey") || null;
  await publishImage(coverImageKey);

  const data = {
    title,
    slug: str(formData, "slug") || slugify(title),
    excerpt: str(formData, "excerpt") || null,
    bodyMdx,
    categoryId: str(formData, "categoryId") || null,
    visibility: (str(formData, "visibility") || "public") as Visibility,
    allowedEmails: emailList(formData, "allowedEmails"),
    status: (str(formData, "status") || "draft") as "draft" | "published",
    coverImageKey,
    metaTitle: str(formData, "metaTitle") || null,
    metaDescription: str(formData, "metaDescription") || null,
    readingMinutes: readingMinutes(bodyMdx),
    updatedAt: new Date(),
  };

  let postId = id;
  if (id) {
    const [existing] = await db
      .select({ publishedAt: posts.publishedAt })
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1);
    const publishedAt =
      data.status === "published"
        ? (existing?.publishedAt ?? new Date())
        : (existing?.publishedAt ?? null);
    await db.update(posts).set({ ...data, publishedAt }).where(eq(posts.id, id));
  } else {
    const [row] = await db
      .insert(posts)
      .values({ ...data, publishedAt: data.status === "published" ? new Date() : null })
      .returning({ id: posts.id });
    postId = row.id;
  }

  await syncPostTags(
    postId,
    str(formData, "tags")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  );

  revalidateBlog();
  redirect("/blog/admin");
}

export async function deletePost(formData: FormData): Promise<void> {
  await requireOwner();
  const id = str(formData, "id");
  if (id) await db.delete(posts).where(eq(posts.id, id));
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

export async function saveCategory(formData: FormData): Promise<void> {
  await requireOwner();
  const id = str(formData, "id");
  const name = str(formData, "name");
  const coverImageKey = str(formData, "coverImageKey") || null;
  await publishImage(coverImageKey);

  const data = {
    name,
    slug: str(formData, "slug") || slugify(name),
    description: str(formData, "description") || null,
    accentColor: str(formData, "accentColor") || "#3b3b3b",
    coverImageKey,
    visibility: (str(formData, "visibility") || "public") as Visibility,
    allowedEmails: emailList(formData, "allowedEmails"),
    sortOrder: Number(str(formData, "sortOrder")) || 0,
    updatedAt: new Date(),
  };

  if (id) await db.update(categories).set(data).where(eq(categories.id, id));
  else await db.insert(categories).values(data);

  revalidateBlog();
  redirect("/blog/admin");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireOwner();
  const id = str(formData, "id");
  if (id) await db.delete(categories).where(eq(categories.id, id));
  revalidateBlog();
  redirect("/blog/admin");
}

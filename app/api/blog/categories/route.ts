import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import GithubSlugger from "github-slugger";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { auth } from "@/lib/auth";

/** Owner-gated: create a category inline (from the post editor). */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let name = "";
  try {
    const body = (await request.json()) as { name?: string };
    name = typeof body.name === "string" ? body.name.trim() : "";
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const slug = new GithubSlugger().slug(name);
  // If the slug already exists, return that category rather than silently
  // renaming it (which would surprise the owner who thinks they made a new one).
  const [existing] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  if (existing) return NextResponse.json({ ...existing, existed: true });

  const [row] = await db
    .insert(categories)
    .values({ name, slug })
    .returning({ id: categories.id, name: categories.name });
  revalidatePath("/blog", "layout");
  return NextResponse.json(row);
}

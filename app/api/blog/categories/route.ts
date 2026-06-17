import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
  const [row] = await db
    .insert(categories)
    .values({ name, slug })
    .onConflictDoUpdate({ target: categories.slug, set: { name } })
    .returning({ id: categories.id, name: categories.name });
  revalidatePath("/blog", "layout");
  return NextResponse.json(row);
}

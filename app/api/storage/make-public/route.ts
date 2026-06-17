import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { makePublic, isManagedKey } from "@/lib/storage/gcs";

/** Owner-gated: make an uploaded object world-readable; returns its public URL.
 *  Used after an in-editor image upload so the image renders on the post. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let key = "";
  try {
    const body = (await request.json()) as { key?: string };
    key = typeof body.key === "string" ? body.key : "";
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  // Only publish keys that look like ones we minted — never an arbitrary path,
  // so this can't be used to flip some other (gated/private) object public.
  if (!isManagedKey(key)) {
    return NextResponse.json({ error: "invalid key" }, { status: 400 });
  }
  const url = await makePublic(key);
  return NextResponse.json({ url });
}

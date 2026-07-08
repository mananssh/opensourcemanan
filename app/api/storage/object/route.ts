import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteObject, isManagedKey } from "@/lib/storage/object-store";

/**
 * Owner-gated: delete an uploaded-but-not-yet-saved object. Used by the upload
 * widgets when the owner replaces or removes a picked file before submitting
 * the form, so an abandoned upload doesn't linger in the bucket unreferenced.
 */
export async function DELETE(request: Request) {
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
  // Only ever delete keys that look like ones we minted.
  if (!isManagedKey(key)) {
    return NextResponse.json({ error: "invalid key" }, { status: 400 });
  }
  await deleteObject(key);
  return NextResponse.json({ ok: true });
}

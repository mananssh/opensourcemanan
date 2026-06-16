import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createUploadUrl, type StorageVertical } from "@/lib/storage/gcs";

const VERTICALS = new Set<StorageVertical>(["blog", "projects", "misc"]);

/**
 * Owner-gated presigned-upload endpoint. Any vertical's admin requests an upload
 * URL here, then PUTs the file straight to GCS and persists the returned key.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { vertical?: string; filename?: string; contentType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { vertical, filename, contentType } = body;
  if (
    !vertical ||
    !VERTICALS.has(vertical as StorageVertical) ||
    !filename ||
    !contentType
  ) {
    return NextResponse.json(
      { error: "vertical, filename, and contentType are required" },
      { status: 400 },
    );
  }
  if (!/^image\//.test(contentType)) {
    return NextResponse.json(
      { error: "Only image uploads are allowed" },
      { status: 400 },
    );
  }

  const result = await createUploadUrl({
    vertical: vertical as StorageVertical,
    filename,
    contentType,
  });
  return NextResponse.json(result);
}

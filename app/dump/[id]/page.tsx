import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getThoughtAccess } from "@/lib/dump/queries";
import { StickyNote } from "@/components/dump/sticky-note";

type Params = Promise<{ id: string }>;

// Thoughts are login-gated, so permalinks aren't indexed.
export const metadata: Metadata = {
  title: "Thought",
  robots: { index: false, follow: false },
};

export default async function ThoughtPage({ params }: { params: Params }) {
  const { id } = await params;
  const access = await getThoughtAccess(id);
  if (access.status === "signin") redirect(`/sign-in?next=/dump/${id}`);
  if (access.status === "notfound") notFound();

  const session = await auth();
  const isOwner = session?.user?.isOwner ?? false;

  return (
    <div className="mx-auto w-full max-w-xl px-6 pb-28 pt-20">
      <div className="mx-auto max-w-sm">
        <StickyNote thought={access.thought} isOwner={isOwner} />
      </div>
      <div className="mt-12 text-center">
        <Link
          href="/dump"
          className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
        >
          ← the whole wall
        </Link>
      </div>
    </div>
  );
}

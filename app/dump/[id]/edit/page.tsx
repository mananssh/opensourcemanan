import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { getThoughtAccess } from "@/lib/dump/queries";
import { StickyComposer } from "@/components/dump/sticky-composer";

type Params = Promise<{ id: string }>;

export const metadata: Metadata = {
  title: "Edit thought",
  robots: { index: false, follow: false },
};

export default async function EditThoughtPage({ params }: { params: Params }) {
  await requireOwner();
  const { id } = await params;
  const access = await getThoughtAccess(id);
  if (access.status !== "ok") notFound();
  const t = access.thought;

  return (
    <div className="mx-auto w-full max-w-xl px-6 pb-28 pt-16">
      <h1 className="mb-6 font-display text-4xl font-bold text-ink">
        Edit thought<span className="text-accent">.</span>
      </h1>
      <StickyComposer
        initial={{
          id: t.id,
          body: t.body,
          imageKey: t.imageKey,
          imageUrl: t.imageUrl,
          visibility: t.visibility,
        }}
      />
      <Link
        href={`/dump/${t.id}`}
        className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
      >
        ← cancel
      </Link>
    </div>
  );
}

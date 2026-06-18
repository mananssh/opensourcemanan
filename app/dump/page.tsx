import Link from "next/link";
import { auth } from "@/lib/auth";
import { listVisibleThoughts } from "@/lib/dump/queries";
import { StickyNote } from "@/components/dump/sticky-note";
import { StickyComposer } from "@/components/dump/sticky-composer";

export const metadata = {
  title: "Thought Dump",
  description: "A wall of half-formed thoughts on sticky notes.",
};

export default async function DumpWall() {
  const session = await auth();
  const isOwner = session?.user?.isOwner ?? false;
  const thoughts = await listVisibleThoughts();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-28 pt-16">
      <header className="pb-10">
        <h1 className="font-display text-6xl font-bold leading-[0.9] tracking-tight text-ink sm:text-7xl">
          Thought dump<span className="text-accent">.</span>
        </h1>
        <p className="mt-3 font-body text-2xl text-muted">
          Whatever&rsquo;s rattling around — stuck to the wall.
        </p>
      </header>

      {isOwner && <StickyComposer />}

      {!session?.user && (
        <p className="mb-10 rounded-lg border border-rule bg-surface px-5 py-4 font-mono text-sm text-muted">
          <Link href="/sign-in?next=/dump" className="text-accent hover:underline">
            Sign in
          </Link>{" "}
          to read the wall.
        </p>
      )}

      {thoughts.length > 0 ? (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {thoughts.map((t, i) => (
            <StickyNote key={t.id} thought={t} isOwner={isOwner} index={i} />
          ))}
        </div>
      ) : (
        session?.user && (
          <p className="font-body text-2xl text-faint">
            Nothing here yet.
          </p>
        )
      )}
    </div>
  );
}

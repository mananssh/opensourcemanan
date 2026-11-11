import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getGame } from "@/lib/games/registry";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) return { title: "Not found" };
  return {
    title: game.title,
    description: game.blurb,
  };
}

/**
 * Detail route for a registered game. v1 has an empty registry — unknown
 * slugs 404. When a game ships, resolve it here and render its Play surface.
 */
export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-faint">
        {game.status === "live" ? "Live" : "Coming soon"}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {game.title}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">{game.blurb}</p>
      {game.status === "soon" ? (
        <p className="mt-10 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-faint">
          Not playable yet — check back when it ships.
        </p>
      ) : null}
      <Link
        href="/games"
        className="mt-12 inline-flex cursor-pointer items-center font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent"
      >
        ← Cabinets
      </Link>
    </div>
  );
}

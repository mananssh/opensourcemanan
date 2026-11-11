import { notFound, redirect } from "next/navigation";
import { GeetdleApp } from "@/components/games/geetdle/geetdle-app";
import { getPuzzleNumber } from "@/lib/games/geetdle/rules";

/**
 * Play a past Geetdle. The puzzle number is deterministic, so any 1..today
 * number resolves to that day's answer server-side. Today's number redirects to
 * the canonical /games/geetdle; the future and invalid numbers 404.
 */
export default async function GeetdleArchivePuzzlePage({
  params,
}: {
  params: Promise<{ puzzle: string }>;
}) {
  const { puzzle } = await params;
  const n = Number(puzzle);
  const today = getPuzzleNumber();
  if (!Number.isInteger(n) || n < 1 || n > today) notFound();
  if (n === today) redirect("/games/geetdle");
  return <GeetdleApp puzzleNumber={n} archive />;
}

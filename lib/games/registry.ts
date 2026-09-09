import type { GameDefinition } from "./types";

/**
 * Static registry of playable games. Add a game = append here + ship the
 * play route module.
 */
export const games: readonly GameDefinition[] = [
  {
    slug: "blind",
    title: "Blind",
    blurb: "Same room. One of you has the wrong word. Pass-and-play Undercover.",
    status: "live",
    access: "public",
  },
];

export function listGames(): readonly GameDefinition[] {
  return games;
}

export function getGame(slug: string): GameDefinition | undefined {
  return games.find((g) => g.slug === slug);
}

export function listLiveGames(): readonly GameDefinition[] {
  return games.filter((g) => g.status === "live");
}

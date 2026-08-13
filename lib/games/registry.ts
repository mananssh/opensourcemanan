import type { GameDefinition } from "./types";

/**
 * Static registry of playable games. Add a game = append here + ship the
 * play route module. v1 ships empty — the arcade shell is the product.
 */
export const games: readonly GameDefinition[] = [];

export function listGames(): readonly GameDefinition[] {
  return games;
}

export function getGame(slug: string): GameDefinition | undefined {
  return games.find((g) => g.slug === slug);
}

export function listLiveGames(): readonly GameDefinition[] {
  return games.filter((g) => g.status === "live");
}

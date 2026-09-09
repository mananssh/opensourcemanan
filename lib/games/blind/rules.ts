import type { BlindPack, BlindPlayer, WordPair, WinnerFaction } from "./types";
import { MAX_PLAYERS, MIN_PLAYERS } from "./types";

/** Max undercovers: N < players/2 → floor((n - 1) / 2), at least 1 when n >= 3. */
export function maxUndercovers(playerCount: number): number {
  if (playerCount < MIN_PLAYERS) return 0;
  return Math.max(1, Math.floor((playerCount - 1) / 2));
}

export function isValidUndercoverCount(n: number, playerCount: number): boolean {
  const max = maxUndercovers(playerCount);
  return Number.isInteger(n) && n >= 1 && n <= max;
}

export function isValidPlayerCount(n: number): boolean {
  return Number.isInteger(n) && n >= MIN_PLAYERS && n <= MAX_PLAYERS;
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function pickRandomPair(pack: BlindPack): WordPair {
  if (pack.pairs.length === 0) throw new Error("Pack has no pairs");
  return pack.pairs[Math.floor(Math.random() * pack.pairs.length)]!;
}

/**
 * Deal roles + words. Undercovers do not get a UI label — only a different word.
 */
export function dealPlayers(
  names: string[],
  undercoverCount: number,
  pair: WordPair,
): BlindPlayer[] {
  if (!isValidPlayerCount(names.length)) {
    throw new Error(`Need ${MIN_PLAYERS}–${MAX_PLAYERS} players`);
  }
  if (!isValidUndercoverCount(undercoverCount, names.length)) {
    throw new Error(`Invalid undercover count for ${names.length} players`);
  }

  const indices = shuffleInPlace([...Array(names.length).keys()]);
  const undercoverSet = new Set(indices.slice(0, undercoverCount));

  return names.map((name, i) => {
    const isUc = undercoverSet.has(i);
    return {
      id: `p-${i}-${name.trim().toLowerCase().replace(/\s+/g, "-")}`,
      name: name.trim(),
      role: isUc ? "undercover" : "civilian",
      word: isUc ? pair.undercover : pair.majority,
      alive: true,
    };
  });
}

export function alivePlayers(players: BlindPlayer[]): BlindPlayer[] {
  return players.filter((p) => p.alive);
}

export function countAliveByRole(players: BlindPlayer[]): {
  civilians: number;
  undercover: number;
} {
  const alive = alivePlayers(players);
  return {
    civilians: alive.filter((p) => p.role === "civilian").length,
    undercover: alive.filter((p) => p.role === "undercover").length,
  };
}

/**
 * After an elimination: civilians win if no undercovers left;
 * undercovers win if undercovers >= civilians among remaining alive.
 */
export function checkWinner(players: BlindPlayer[]): WinnerFaction | null {
  const { civilians, undercover } = countAliveByRole(players);
  if (undercover === 0) return "civilians";
  if (undercover >= civilians) return "undercover";
  return null;
}

export function eliminatePlayer(
  players: BlindPlayer[],
  playerId: string,
): BlindPlayer[] {
  return players.map((p) => (p.id === playerId ? { ...p, alive: false } : p));
}

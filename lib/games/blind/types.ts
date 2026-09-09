/**
 * Blind pack + session types. Pack schema is shared by default JSON,
 * WhatsApp extract downloads, and Load Pack.
 */

export type WordPair = {
  majority: string;
  undercover: string;
};

export type BlindPack = {
  version: number;
  title?: string;
  locale?: string;
  pairs: WordPair[];
};

export type PlayerRole = "civilian" | "undercover";

export type BlindPlayer = {
  id: string;
  name: string;
  /** Assigned at deal — never shown until end reveal. */
  role: PlayerRole;
  word: string;
  alive: boolean;
};

export type BlindPhase =
  | "hub"
  | "setup-players"
  | "setup-source"
  | "whatsapp"
  | "load-pack"
  | "review-pack"
  | "deal-pass"
  | "deal-reveal"
  | "hints"
  | "vote"
  | "vote-result"
  | "end";

export type WinnerFaction = "civilians" | "undercover";

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const PACK_VERSION = 1;

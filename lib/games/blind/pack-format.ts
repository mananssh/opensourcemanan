/**
 * Blind pack format (v1)
 *
 * Drop your 1000+ pair file at content/games/blind/default-pack.json
 * (same shape as WhatsApp downloads / Load Pack).
 *
 * {
 *   "version": 1,
 *   "title": "Blind default",
 *   "locale": "en",
 *   "pairs": [
 *     { "majority": "coffee", "undercover": "espresso" }
 *   ]
 * }
 *
 * - version: positive integer (use 1)
 * - title, locale: optional
 * - pairs: non-empty; majority ≠ undercover (case-insensitive)
 */

export { parseBlindPack, parseBlindPackJson, packToDownloadJson } from "./pack-schema";
export type { BlindPack, WordPair } from "./types";

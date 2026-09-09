import type { BlindPack, WordPair } from "./types";
import { PACK_VERSION } from "./types";

export type PackParseResult =
  | { ok: true; pack: BlindPack }
  | { ok: false; error: string };

function asTrimmedString(v: unknown, field: string): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  void field;
  return t;
}

function parsePair(raw: unknown, index: number): WordPair | string {
  if (!raw || typeof raw !== "object") {
    return `pairs[${index}] must be an object`;
  }
  const o = raw as Record<string, unknown>;
  const majority = asTrimmedString(o.majority, "majority");
  const undercover = asTrimmedString(o.undercover, "undercover");
  if (!majority) return `pairs[${index}].majority must be a non-empty string`;
  if (!undercover) return `pairs[${index}].undercover must be a non-empty string`;
  if (majority.toLowerCase() === undercover.toLowerCase()) {
    return `pairs[${index}]: majority and undercover must differ`;
  }
  return { majority, undercover };
}

/**
 * Validate Blind pack JSON (default / download / load — one schema).
 * No Zod dependency — same rules as docs/design + plan format.
 */
export function parseBlindPack(input: unknown): PackParseResult {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Pack must be a JSON object" };
  }
  const o = input as Record<string, unknown>;

  if (typeof o.version !== "number" || !Number.isInteger(o.version) || o.version < 1) {
    return { ok: false, error: "version must be a positive integer" };
  }

  if (o.title !== undefined && typeof o.title !== "string") {
    return { ok: false, error: "title must be a string when present" };
  }
  if (o.locale !== undefined && typeof o.locale !== "string") {
    return { ok: false, error: "locale must be a string when present" };
  }

  if (!Array.isArray(o.pairs) || o.pairs.length < 1) {
    return { ok: false, error: "pairs must be a non-empty array" };
  }

  const pairs: WordPair[] = [];
  for (let i = 0; i < o.pairs.length; i++) {
    const parsed = parsePair(o.pairs[i], i);
    if (typeof parsed === "string") return { ok: false, error: parsed };
    pairs.push(parsed);
  }

  const pack: BlindPack = {
    version: o.version,
    pairs,
  };
  if (typeof o.title === "string" && o.title.trim()) pack.title = o.title.trim();
  if (typeof o.locale === "string" && o.locale.trim()) pack.locale = o.locale.trim();
  else pack.locale = "en";

  return { ok: true, pack };
}

export function parseBlindPackJson(text: string): PackParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
  return parseBlindPack(data);
}

export function packToDownloadJson(pack: BlindPack): string {
  return `${JSON.stringify(
    {
      version: pack.version || PACK_VERSION,
      ...(pack.title ? { title: pack.title } : {}),
      locale: pack.locale ?? "en",
      pairs: pack.pairs,
    },
    null,
    2,
  )}\n`;
}

export function downloadPackFile(pack: BlindPack, filename = "blind-pack.json") {
  const blob = new Blob([packToDownloadJson(pack)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

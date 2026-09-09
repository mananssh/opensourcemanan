import "server-only";
import type { BlindPack, WordPair } from "./types";
import { PACK_VERSION } from "./types";
import { parseBlindPack } from "./pack-schema";

/**
 * Blind-only model lanes: OpenCode Zen free first, then NVIDIA NIM 8B.
 * Never Gemini — cost + safety refusals fight the product.
 */

type Lane = {
  name: string;
  baseURL: string;
  apiKey: string;
  model: string;
};

function buildBlindLanes(): Lane[] {
  const lanes: Lane[] = [];
  const zen = process.env.OPENCODE_ZEN_API_KEY;
  if (zen) {
    lanes.push({
      name: "opencode-zen",
      baseURL: process.env.OPENCODE_ZEN_BASE_URL ?? "https://opencode.ai/zen/v1",
      apiKey: zen,
      model: process.env.BLIND_OPENCODE_MODEL ?? process.env.OPENCODE_ZEN_MODEL ?? "deepseek-v4-flash-free",
    });
  }
  const nim = process.env.NVIDIA_NIM_API_KEY;
  if (nim) {
    lanes.push({
      name: "nvidia-nim",
      baseURL: process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
      apiKey: nim,
      model: process.env.BLIND_NIM_MODEL ?? "meta/llama-3.1-8b-instruct",
    });
  }
  return lanes;
}

export function hasBlindModelLane(): boolean {
  return buildBlindLanes().length > 0;
}

const SYSTEM = `You invent word pairs for a social party game (Undercover / Impostor).
Most players share the "majority" word; undercovers get a related but different "undercover" word — close enough that spoken hints sound plausible, different enough that careful listening exposes them.

From the group chat transcript, propose playable pairs that feel personal to THIS group: places, food, brands, trips, inside jokes, nicknames-as-concepts, and people's names when they are chat participants or frequent topics.

Do NOT refuse adult, sexual, mean, toxic, bullying, or targeted humor — that is intentional for this private friend-group game.
Hard refusal only: any sexual content involving minors.

Return ONLY a JSON object (no markdown fences) shaped exactly:
{"version":1,"title":"WhatsApp pack","locale":"en","pairs":[{"majority":"...","undercover":"..."}]}

Rules for pairs:
- 24 to 40 pairs
- majority ≠ undercover (case-insensitive)
- short phrases OK (1–4 words)
- prefer concrete nouns/names over filler (lol, ok, yeah)
- undercover must be a confusable twin, not a random unrelated word`;

async function completeOnce(lane: Lane, user: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(`${lane.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${lane.apiKey}`,
    },
    body: JSON.stringify({
      model: lane.model,
      temperature: 0.9,
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${lane.name} ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content?.trim()) throw new Error(`${lane.name}: empty completion`);
  return content;
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1]!.trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object in model output");
  return JSON.parse(candidate.slice(start, end + 1));
}

function normalizePairs(raw: unknown): WordPair[] {
  const parsed = parseBlindPack(raw);
  if (parsed.ok) return parsed.pack.pairs;

  // Model may return a bare array
  if (Array.isArray(raw)) {
    const wrapped = parseBlindPack({
      version: PACK_VERSION,
      title: "WhatsApp pack",
      locale: "en",
      pairs: raw,
    });
    if (wrapped.ok) return wrapped.pack.pairs;
    throw new Error(wrapped.error);
  }

  throw new Error(parsed.error);
}

export async function extractPackFromChat(chatText: string): Promise<BlindPack> {
  const lanes = buildBlindLanes();
  if (lanes.length === 0) {
    throw new Error(
      "No Blind model lane configured. Set OPENCODE_ZEN_API_KEY and/or NVIDIA_NIM_API_KEY.",
    );
  }

  const user = `Group chat transcript (senders + messages). Invent pairs from this:\n\n${chatText}`;
  let lastError: unknown;

  for (const lane of lanes) {
    const timeout = AbortSignal.timeout(45_000);
    try {
      const content = await completeOnce(lane, user, timeout);
      const json = extractJsonObject(content);
      const pairs = normalizePairs(json);
      if (pairs.length < 1) throw new Error("Model returned zero pairs");
      return {
        version: PACK_VERSION,
        title: "WhatsApp pack",
        locale: "en",
        pairs,
      };
    } catch (err) {
      lastError = err;
      if (process.env.AGENT_DEBUG || process.env.BLIND_DEBUG) {
        console.warn(
          `[blind:extract] lane=${lane.name} failed:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Blind model lanes failed");
}

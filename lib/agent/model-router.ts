import "server-only";
import type { NodeId } from "@/components/portfolio/agent/agent-types";
import type { Emit } from "./events";
import { JSON_SENTINEL } from "./prompts";

/**
 * A tiny server-side model router over OpenAI-compatible endpoints, with per-node
 * tiers and failover. Anchored on Gemini Flash; falls over to NVIDIA NIM, then
 * OpenCode Zen on a rate-limit/5xx. Keys are server-only env vars. Base URLs and
 * model ids are overridable via env because free rosters/endpoints rotate
 * (especially OpenCode Zen — see .env.example).
 *
 * Privacy: only the recruiter's JD ever flows through these; do not route
 * anything sensitive — NIM (trial) and OpenCode (free) may train on / log data.
 */

type Tier = "fast" | "strong";

interface Lane {
  name: string;
  baseURL: string;
  apiKey: string;
  model: Record<Tier, string>;
}

function buildLanes(): Lane[] {
  const lanes: Lane[] = [];
  const gemini = process.env.GEMINI_API_KEY;
  if (gemini) {
    lanes.push({
      name: "gemini",
      baseURL: process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: gemini,
      model: {
        fast: process.env.GEMINI_MODEL_FAST ?? "gemini-2.0-flash",
        strong: process.env.GEMINI_MODEL_STRONG ?? "gemini-2.5-flash",
      },
    });
  }
  const nim = process.env.NVIDIA_NIM_API_KEY;
  if (nim) {
    lanes.push({
      name: "nvidia-nim",
      baseURL: process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
      apiKey: nim,
      model: {
        fast: process.env.NVIDIA_NIM_MODEL_FAST ?? "meta/llama-3.1-8b-instruct",
        strong: process.env.NVIDIA_NIM_MODEL_STRONG ?? "meta/llama-3.3-70b-instruct",
      },
    });
  }
  const zen = process.env.OPENCODE_ZEN_API_KEY;
  if (zen) {
    const model = process.env.OPENCODE_ZEN_MODEL ?? "glm-5-free";
    lanes.push({
      name: "opencode-zen",
      baseURL: process.env.OPENCODE_ZEN_BASE_URL ?? "https://opencode.ai/zen/v1",
      apiKey: zen,
      model: { fast: model, strong: model },
    });
  }
  return lanes;
}

/** True if at least one model lane has a key — false means no live runs possible. */
export function hasModelLane(): boolean {
  return buildLanes().length > 0;
}

/** Per-node tier: cheap/fast for classification-shaped, stronger for generative. */
const TIER: Record<NodeId, Tier> = {
  intake: "fast",
  fit_gate: "fast",
  critique: "fast",
  plan: "strong",
  synthesize: "strong",
  compose: "strong",
  work_history: "strong",
  projects: "strong",
  web_corpus: "strong",
};

class RetryableError extends Error {}

export class AllLanesFailedError extends Error {
  constructor(public lastError: unknown) {
    super("all model lanes failed");
    this.name = "AllLanesFailedError";
  }
}

const NODE_TIMEOUT_MS = Number(process.env.AGENT_NODE_TIMEOUT_MS ?? 24_000);

interface StreamArgs {
  node: NodeId;
  system: string;
  user: string;
  emit: Emit;
  signal?: AbortSignal;
  /** When true, split reasoning (streamed) from a trailing JSON object (parsed). */
  jsonTail?: boolean;
  temperature?: number;
}

export interface StreamResult {
  /** The visible reasoning text (everything before the JSON sentinel). */
  text: string;
  /** The parsed trailing JSON object, when `jsonTail` was requested. */
  json: unknown;
  lane: string;
}

/**
 * Stream a chat completion, forwarding visible reasoning deltas to `emit`. Tries
 * each lane in order; only fails over BEFORE the first token (a clean 429/5xx).
 * Once tokens flow we commit to that lane (so the visible thinking stays honest).
 */
export async function streamChat(args: StreamArgs): Promise<StreamResult> {
  const lanes = buildLanes();
  if (lanes.length === 0) {
    throw new Error(
      "No model lane configured. Set GEMINI_API_KEY (and optionally NVIDIA_NIM_API_KEY / OPENCODE_ZEN_API_KEY).",
    );
  }
  const tier = TIER[args.node];
  let lastError: unknown;

  for (const lane of lanes) {
    try {
      return await streamOnce(lane, tier, args);
    } catch (err) {
      lastError = err;
      if (err instanceof RetryableError) continue; // try next lane
      throw err; // non-retryable (e.g. mid-stream) — surface it
    }
  }
  throw new AllLanesFailedError(lastError);
}

async function streamOnce(lane: Lane, tier: Tier, args: StreamArgs): Promise<StreamResult> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), NODE_TIMEOUT_MS);
  // Abort if either the per-node timeout fires or the request is cancelled.
  const onAbort = () => timeout.abort();
  args.signal?.addEventListener("abort", onAbort);

  let emittedAny = false;
  try {
    const res = await fetch(`${lane.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${lane.apiKey}`,
      },
      body: JSON.stringify({
        model: lane.model[tier],
        stream: true,
        temperature: args.temperature ?? 0.4,
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
      }),
      signal: timeout.signal,
    });

    if (!res.ok || !res.body) {
      // Before any token: rate-limit / server errors are retryable on the next lane.
      if (res.status === 429 || res.status >= 500) throw new RetryableError(`${lane.name} ${res.status}`);
      const body = await res.text().catch(() => "");
      throw new Error(`${lane.name} ${res.status}: ${body.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let full = "";
    let emittedVisible = 0;

    const forward = () => {
      const idx = args.jsonTail ? full.indexOf(JSON_SENTINEL) : -1;
      const visibleEnd = idx === -1 ? full.length : idx;
      if (visibleEnd > emittedVisible) {
        args.emit({ type: "node_reasoning", node: args.node, delta: full.slice(emittedVisible, visibleEnd) });
        emittedVisible = visibleEnd;
        emittedAny = true;
      }
    };

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;
        let token = "";
        try {
          const obj = JSON.parse(payload);
          token = obj?.choices?.[0]?.delta?.content ?? "";
        } catch {
          continue; // ignore keep-alives / partial frames
        }
        if (token) {
          full += token;
          forward();
        }
      }
    }
    forward();

    const visible = args.jsonTail
      ? full.slice(0, full.indexOf(JSON_SENTINEL) === -1 ? full.length : full.indexOf(JSON_SENTINEL))
      : full;
    const json = args.jsonTail ? parseJsonTail(full) : undefined;
    return { text: visible.trim(), json, lane: lane.name };
  } catch (err) {
    // A timeout/abort before the first token is retryable on the next lane.
    if (!emittedAny && (timeout.signal.aborted || err instanceof RetryableError)) {
      throw new RetryableError(`${lane.name}: ${(err as Error).message}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
    args.signal?.removeEventListener("abort", onAbort);
  }
}

/** Extract the JSON object after the sentinel; tolerant of code fences. */
function parseJsonTail(full: string): unknown {
  const idx = full.indexOf(JSON_SENTINEL);
  let tail = idx === -1 ? full : full.slice(idx + JSON_SENTINEL.length);
  tail = tail.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = tail.indexOf("{");
  const end = tail.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return undefined;
  try {
    return JSON.parse(tail.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

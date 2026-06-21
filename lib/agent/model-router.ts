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
        // Default to non-thinking flash on both tiers: fast, reliable inside the
        // route's 60s budget, and (unlike 2.5's thinking mode) its visible output
        // can't be starved by hidden reasoning tokens. Override via env if wanted.
        fast: process.env.GEMINI_MODEL_FAST ?? "gemini-2.0-flash",
        strong: process.env.GEMINI_MODEL_STRONG ?? "gemini-2.0-flash",
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

/**
 * Per-node tier. Classification- and selection-shaped nodes (intake, gate,
 * critique, the three gather nodes) use the fast model — on a failover lane that's
 * the difference between an 8B and a slow 70B, which keeps the run inside budget.
 * Only the genuinely generative nodes (plan, synthesize, compose) use strong.
 */
const TIER: Record<NodeId, Tier> = {
  intake: "fast",
  fit_gate: "fast",
  critique: "fast",
  work_history: "fast",
  projects: "fast",
  web_corpus: "fast",
  plan: "strong",
  synthesize: "strong",
  compose: "strong",
};

class RetryableError extends Error {}

export class AllLanesFailedError extends Error {
  constructor(public lastError: unknown) {
    super("all model lanes failed");
    this.name = "AllLanesFailedError";
  }
}

// Idle timeout (no bytes received), not total — see streamOnce.
const NODE_TIMEOUT_MS = Number(process.env.AGENT_NODE_TIMEOUT_MS ?? 10_000);

/**
 * Lane circuit breaker. A free tier that stalls (common) would otherwise cost
 * every node the full idle timeout before failing over — minutes across a run.
 * Once a lane fails repeatedly we skip it for a cooldown, so the rest of the run
 * (and the next few) goes straight to a working lane; it's re-probed after.
 */
const LANE_FAIL_THRESHOLD = 2;
const LANE_COOLDOWN_MS = Number(process.env.AGENT_LANE_COOLDOWN_MS ?? 60_000);
const laneState = new Map<string, { fails: number; until: number }>();

function laneDisabled(name: string): boolean {
  const s = laneState.get(name);
  return !!s && s.until > Date.now();
}
function noteLaneFailure(name: string): void {
  const s = laneState.get(name) ?? { fails: 0, until: 0 };
  s.fails += 1;
  if (s.fails >= LANE_FAIL_THRESHOLD) {
    s.until = Date.now() + LANE_COOLDOWN_MS;
    s.fails = 0;
  }
  laneState.set(name, s);
}
function noteLaneSuccess(name: string): void {
  laneState.delete(name);
}

/** Run-scoped accumulator for "which model / how many tokens" telemetry. */
export interface UsageSink {
  add(tokens: number, model: string): void;
}

interface StreamArgs {
  node: NodeId;
  system: string;
  user: string;
  emit: Emit;
  signal?: AbortSignal;
  /** When true, split reasoning (streamed) from a trailing JSON object (parsed). */
  jsonTail?: boolean;
  temperature?: number;
  /** Cap output so a verbose node can't run past its JSON tail or the timeout. */
  maxTokens?: number;
  /** Run-scoped usage accumulator (model + token totals). */
  usage?: UsageSink;
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

  // Prefer lanes not in cooldown; if all are cooling down, try them anyway.
  const enabled = lanes.filter((l) => !laneDisabled(l.name));
  const tryLanes = enabled.length ? enabled : lanes;

  for (const lane of tryLanes) {
    try {
      const result = await streamOnce(lane, tier, args);
      noteLaneSuccess(lane.name);
      return result;
    } catch (err) {
      lastError = err;
      noteLaneFailure(lane.name);
      if (err instanceof RetryableError) continue; // try next lane
      throw err; // non-retryable (substantial output already streamed) — surface it
    }
  }
  throw new AllLanesFailedError(lastError);
}

async function streamOnce(lane: Lane, tier: Tier, args: StreamArgs): Promise<StreamResult> {
  const timeout = new AbortController();
  // An IDLE timeout: re-armed on every byte received, so a steadily-streaming
  // long response is never killed, but a STALLED stream (common when a free tier
  // throttles mid-stream) aborts quickly and we move on.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = () => {
    clearTimeout(timer);
    timer = setTimeout(() => timeout.abort(), NODE_TIMEOUT_MS);
  };
  arm();
  // Abort if either the idle timeout fires or the request is cancelled.
  const onAbort = () => timeout.abort();
  args.signal?.addEventListener("abort", onAbort);

  let emittedChars = 0;
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
        stream_options: { include_usage: true },
        temperature: args.temperature ?? 0.4,
        ...(args.maxTokens ? { max_tokens: args.maxTokens } : {}),
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
      }),
      signal: timeout.signal,
    });

    if (!res.ok || !res.body) {
      // Any non-2xx (rate limit, auth, server error) is retryable on the next lane.
      const body = !res.body ? "" : await res.text().catch(() => "");
      throw new RetryableError(`${lane.name} ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let full = "";
    let emittedVisible = 0;
    let usageTokens = 0;
    let respModel = lane.model[tier];

    const forward = () => {
      const idx = args.jsonTail ? full.indexOf(JSON_SENTINEL) : -1;
      const visibleEnd = idx === -1 ? full.length : idx;
      if (visibleEnd > emittedVisible) {
        args.emit({ type: "node_reasoning", node: args.node, delta: full.slice(emittedVisible, visibleEnd) });
        emittedVisible = visibleEnd;
        emittedChars = visibleEnd;
      }
    };

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      arm(); // bytes arrived — reset the idle timer
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
          if (typeof obj?.usage?.total_tokens === "number") usageTokens = obj.usage.total_tokens;
          if (typeof obj?.model === "string") respModel = obj.model;
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
    // Report usage (real if the provider sent it; else a rough token estimate).
    args.usage?.add(usageTokens || Math.round((args.system.length + args.user.length + full.length) / 4), respModel);

    const visible = args.jsonTail
      ? full.slice(0, full.indexOf(JSON_SENTINEL) === -1 ? full.length : full.indexOf(JSON_SENTINEL))
      : full;
    const json = args.jsonTail ? parseJsonTail(full) : undefined;
    if (process.env.AGENT_DEBUG && args.jsonTail) {
      const si = full.indexOf(JSON_SENTINEL);
      console.warn(
        `[sully:${args.node}] lane=${lane.name} sentinel=${si !== -1} parsed=${json !== undefined} textLen=${full.length} tail=${JSON.stringify(full.slice(si === -1 ? full.length - 120 : si, (si === -1 ? full.length : si) + 180))}`,
      );
    }
    return { text: visible.trim(), json, lane: lane.name };
  } catch (err) {
    // A stall (idle-timeout abort) is retryable on the next lane as long as only
    // a little was streamed — re-streaming a near-complete answer would duplicate
    // it in the thinking panel, so a late stall stays non-retryable (node degrades).
    const stalled = timeout.signal.aborted && !args.signal?.aborted;
    if ((stalled && emittedChars < 400) || err instanceof RetryableError) {
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

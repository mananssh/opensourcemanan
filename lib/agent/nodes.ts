import "server-only";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import {
  NODE_LABELS,
  type FitResult,
  type FitVerdict,
  type NodeId,
} from "@/components/portfolio/agent/agent-types";
import type { AgentStateType, EvidenceItem } from "./state";
import type { Emit } from "./events";
import { type Corpus, indexById, renderItems } from "./corpus";
import { streamChat, type ReasoningEmit, type Tier, type UsageSink } from "./model-router";
import { researchCompany } from "./tools/tavily";
import { fill, getPrompt, withJsonTail, wrapUntrusted } from "./prompts";

/** Run-scoped context threaded through the graph's `configurable`. */
export interface RunContext {
  emit: Emit;
  corpus: Corpus;
  signal?: AbortSignal;
  startedAt: number; // epoch ms — used to skip the loop when time is short
  deadlineAt: number; // epoch ms — streamChat stops trying lanes past this
  usage: UsageSink; // model + token telemetry accumulator
}

/**
 * Per-node tier. Classification- and selection-shaped nodes (intake, gate,
 * critique, the three gather nodes) use the fast model — on a failover lane that's
 * the difference between an 8B and a slow 70B, which keeps the run inside budget.
 * Only the genuinely generative nodes (plan, synthesize, compose) use strong.
 */
export const NODE_TIER: Record<NodeId, Tier> = {
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

/** Wraps a node's raw streamed text back into the run's `node_reasoning` event shape. */
function reasoningEmit(ctx: RunContext, node: NodeId): ReasoningEmit {
  return (delta) => ctx.emit({ type: "node_reasoning", node, delta });
}

/** Don't start a re-gather pass once the run has used most of its time budget. */
const SOFT_LOOP_BUDGET_MS = 32_000;

/**
 * Hard ceiling on model-call time across the WHOLE run, well under the route's
 * `maxDuration = 60`. Without this, each of the 9 nodes could independently
 * burn up to ~30s (3 lanes x a 10s idle-timeout) failing over, and the
 * cumulative total across nodes could blow past Vercel's hard kill — an ugly
 * connection drop instead of the graceful per-node degrade this agent is built
 * around. `streamChat` refuses new lane attempts once `ctx.deadlineAt` passes,
 * so every remaining node degrades near-instantly instead.
 */
// 52s: healthy runs finish far earlier; the extra headroom is for degraded mode
// (a primary lane 429ing), where each tier pays one failed probe before its
// failover — still leaves stream-flush + DB-write slack under maxDuration=60.
export const RUN_DEADLINE_MS = Number(process.env.AGENT_RUN_DEADLINE_MS ?? 52_000);

function getCtx(config: LangGraphRunnableConfig): RunContext {
  const ctx = (config?.configurable as { ctx?: RunContext } | undefined)?.ctx;
  if (!ctx) throw new Error("Sully run context missing");
  return ctx;
}

type Update = Partial<AgentStateType>;

/** Wrap a node: emit start → run → done; on throw, emit node_error and rethrow. */
function defineNode(
  id: NodeId,
  handler: (state: AgentStateType, ctx: RunContext) => Promise<{ update: Update; summary?: string }>,
) {
  return async (state: AgentStateType, config: LangGraphRunnableConfig): Promise<Update> => {
    const ctx = getCtx(config);
    ctx.emit({ type: "node_start", node: id, label: NODE_LABELS[id] });
    try {
      const { update, summary } = await handler(state, ctx);
      ctx.emit({ type: "node_done", node: id, summary });
      return update;
    } catch (err) {
      ctx.emit({ type: "node_error", node: id, message: errMsg(err) });
      throw err;
    }
  };
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

interface Pick {
  id: string;
  claim: string;
}
function asPicks(v: unknown): Pick[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p): p is { id: string; claim?: string } => !!p && typeof p.id === "string")
    .map((p) => ({ id: p.id, claim: typeof p.claim === "string" ? p.claim : "" }));
}

const SYSTEM = () => getPrompt("system");

// ── intake ──────────────────────────────────────────────────────────────────
export const intake = defineNode("intake", async (state, ctx) => {
  try {
    const { json } = await streamChat({
      node: "intake",
      tier: NODE_TIER.intake,
      system: SYSTEM(),
      temperature: 0.2,
      jsonTail: true,
      emit: reasoningEmit(ctx, "intake"),
      signal: ctx.signal,
      usage: ctx.usage,
      deadlineAt: ctx.deadlineAt,
      user: withJsonTail(fill(getPrompt("intake"), { job: wrapUntrusted("JOB", state.input) })),
    });
    const obj = (json ?? {}) as {
      company?: unknown;
      role?: unknown;
      requirements?: unknown;
      seniority?: unknown;
      constraints?: unknown;
      looksLikeRole?: unknown;
    };
    const company = typeof obj.company === "string" ? obj.company : undefined;
    const role = typeof obj.role === "string" ? obj.role : undefined;
    const requirements = asStringArray(obj.requirements);
    const seniority = typeof obj.seniority === "string" ? obj.seniority : undefined;
    const constraints = asStringArray(obj.constraints);
    // Biased-yes: only distrust genuineness on an explicit false, never on a
    // missing/malformed field.
    const looksLikeRole = obj.looksLikeRole !== false;
    if (company) ctx.emit({ type: "node_status", node: "intake", detail: `company: ${company}` });
    return {
      update: { company, role, requirements, seniority, constraints, looksLikeRole },
      summary: role ?? "role parsed",
    };
  } catch {
    // Degrade: keep the run alive with the raw posting as the requirement.
    return { update: { requirements: [state.input.slice(0, 280)] }, summary: "role parsed (degraded)" };
  }
});

// ── fit_gate ────────────────────────────────────────────────────────────────
const MIDDLE_NODES: NodeId[] = ["plan", "work_history", "projects", "web_corpus", "synthesize", "critique"];

export const fitGate = defineNode("fit_gate", async (state, ctx) => {
  let verdict: FitVerdict = "plausible";
  let reason = "There is an honest technical path worth exploring.";
  try {
    const { json } = await streamChat({
      node: "fit_gate",
      tier: NODE_TIER.fit_gate,
      system: SYSTEM(),
      temperature: 0.2,
      jsonTail: true,
      emit: reasoningEmit(ctx, "fit_gate"),
      signal: ctx.signal,
      usage: ctx.usage,
      deadlineAt: ctx.deadlineAt,
      user: withJsonTail(
        fill(getPrompt("fit_gate"), {
          profile: ctx.corpus.profileSummary,
          role: state.role ?? "(none detected)",
          requirements: state.requirements.join("; ") || "(none detected)",
          seniority: state.seniority ?? "(unclear)",
          constraints: state.constraints.length ? state.constraints.join("; ") : "(none stated)",
          looksLikeRole: state.looksLikeRole ? "yes" : "no",
        }),
      ),
    });
    const obj = (json ?? {}) as { verdict?: unknown; reason?: unknown };
    if (obj.verdict === "strong" || obj.verdict === "plausible" || obj.verdict === "not_a_fit") {
      verdict = obj.verdict;
    }
    if (typeof obj.reason === "string") reason = obj.reason;
  } catch {
    // Degrade biased-yes: keep the demo alive rather than erroring.
    verdict = "plausible";
  }

  if (verdict === "not_a_fit") {
    // Honestly show the short path: the middle band is skipped, gate jumps to compose.
    for (const n of MIDDLE_NODES) {
      ctx.emit({ type: "node_skipped", node: n, reason: "not a fit — declining" });
    }
    ctx.emit({ type: "edge", from: "fit_gate", to: "compose" });
  }
  return { update: { verdict, gateReason: reason }, summary: verdict.replace("_", " ") };
});

// ── plan ──────────────────────────────────────────────────────────────────--
export const plan = defineNode("plan", async (state, ctx) => {
  const gapNote =
    state.pass > 0 && state.critiqueResult?.gaps?.length
      ? ` This is pass ${state.pass + 1}; close these gaps from the last critique: ${state.critiqueResult.gaps.join("; ")}.`
      : "";
  let dimensions: string[] = [];
  try {
    const { json } = await streamChat({
      node: "plan",
      tier: NODE_TIER.plan,
      system: SYSTEM(),
      temperature: 0.5,
      jsonTail: true,
      emit: reasoningEmit(ctx, "plan"),
      signal: ctx.signal,
      usage: ctx.usage,
      deadlineAt: ctx.deadlineAt,
      user: withJsonTail(
        fill(getPrompt("plan"), {
          requirements: state.requirements.join("; ") || "(see posting)",
          profile: ctx.corpus.profileSummary,
          gapNote,
          seniority: state.seniority ?? "(unclear)",
          constraints: state.constraints.length ? state.constraints.join("; ") : "(none stated)",
        }),
      ),
    });
    dimensions = asStringArray((json as { dimensions?: unknown } | undefined)?.dimensions);
  } catch (err) {
    // Degrade rather than kill the run — fall back to the role's requirements.
    if (process.env.AGENT_DEBUG) console.warn("[sully:plan] threw:", err instanceof Error ? err.message : err);
  }
  const finalPlan = dimensions.length ? dimensions : state.requirements.slice(0, 4);
  return { update: { planDimensions: finalPlan }, summary: `${finalPlan.length} dimensions` };
});

// ── gather: a shared selector over a corpus slice ────────────────────────────
async function gather(
  node: Extract<NodeId, "work_history" | "projects">,
  state: AgentStateType,
  ctx: RunContext,
  items: Corpus["work"],
  source: EvidenceItem["source"],
): Promise<{ update: Update; summary?: string }> {
  if (!items.length) return { update: { evidence: [] }, summary: "none on file" };
  let picks: Pick[] = [];
  try {
    const { json } = await streamChat({
      node,
      tier: NODE_TIER[node],
      system: SYSTEM(),
      temperature: 0.4,
      jsonTail: true,
      emit: reasoningEmit(ctx, node),
      signal: ctx.signal,
      usage: ctx.usage,
      deadlineAt: ctx.deadlineAt,
      user: withJsonTail(
        fill(getPrompt("gather"), {
          dimensions: state.planDimensions.join("; "),
          company: state.company ?? "(unknown)",
          candidates: renderItems(items),
        }),
      ),
    });
    picks = asPicks((json as { picks?: unknown } | undefined)?.picks);
  } catch (err) {
    if (process.env.AGENT_DEBUG) console.warn(`[sully:${node}] threw:`, err instanceof Error ? err.message : err);
    return { update: { evidence: [] }, summary: "model unavailable — skipped" };
  }
  const byId = indexById(items);
  const evidence: EvidenceItem[] = [];
  const seenIds = new Set<string>();
  for (const p of picks) {
    if (seenIds.has(p.id)) continue; // the model sometimes repeats an id
    seenIds.add(p.id);
    const item = byId.get(p.id);
    if (item) evidence.push({ label: item.label, claim: p.claim || item.label, href: item.href, source });
  }
  ctx.emit({ type: "node_status", node, detail: `selected ${evidence.length} of ${items.length}` });
  return { update: { evidence }, summary: `${evidence.length} selected` };
}

export const workHistory = defineNode("work_history", (state, ctx) =>
  gather("work_history", state, ctx, ctx.corpus.work, "work_history"),
);
export const projects = defineNode("projects", (state, ctx) =>
  gather("projects", state, ctx, ctx.corpus.projects, "projects"),
);

// ── web_corpus: Tavily company research (degrade-safe) + remaining corpus ────
export const webCorpus = defineNode("web_corpus", async (state, ctx) => {
  let webFindings: string | undefined;
  if (state.company) {
    ctx.emit({ type: "node_status", node: "web_corpus", detail: `searching: ${state.company}` });
    const web = await researchCompany(state.company, ctx.signal);
    if (web) {
      webFindings = web.findings;
      ctx.emit({ type: "node_status", node: "web_corpus", detail: `${web.sources} sources` });
    } else {
      ctx.emit({ type: "node_status", node: "web_corpus", detail: "web search unavailable — using corpus" });
    }
  }

  let picks: Pick[] = [];
  try {
    const { json } = await streamChat({
      node: "web_corpus",
      tier: NODE_TIER.web_corpus,
      system: SYSTEM(),
      temperature: 0.4,
      jsonTail: true,
      emit: reasoningEmit(ctx, "web_corpus"),
      signal: ctx.signal,
      usage: ctx.usage,
      deadlineAt: ctx.deadlineAt,
      user: withJsonTail(
        fill(getPrompt("web_corpus"), {
          dimensions: state.planDimensions.join("; "),
          webFindings: webFindings ?? "(no web data available)",
          candidates: renderItems(ctx.corpus.corpus),
        }),
      ),
    });
    // The prompt returns `note` (the company-alignment line) + `picks`.
    const obj = (json ?? {}) as { note?: unknown; picks?: unknown };
    if (!webFindings && typeof obj.note === "string" && obj.note.trim()) webFindings = obj.note.trim();
    picks = asPicks(obj.picks);
  } catch {
    return { update: { evidence: [], webFindings }, summary: "model unavailable — skipped" };
  }
  const byId = indexById(ctx.corpus.corpus);
  const evidence: EvidenceItem[] = [];
  for (const p of picks) {
    const item = byId.get(p.id);
    if (item) evidence.push({ label: item.label, claim: p.claim || item.label, href: item.href, source: "web_corpus" });
  }
  return { update: { evidence, webFindings }, summary: webFindings ? "corpus + web" : "corpus" };
});

// ── synthesize ───────────────────────────────────────────────────────────────
function dedupe(evidence: EvidenceItem[]): EvidenceItem[] {
  const seen = new Set<string>();
  const out: EvidenceItem[] = [];
  for (const e of evidence) {
    if (seen.has(e.href)) continue;
    seen.add(e.href);
    out.push(e);
  }
  return out;
}

export const synthesize = defineNode("synthesize", async (state, ctx) => {
  const evidence = dedupe(state.evidence);
  const ev = evidence.map((e) => `- ${e.label}: ${e.claim} (${e.href})`).join("\n") || "(no evidence selected)";
  let draft: string;
  try {
    const { text } = await streamChat({
      node: "synthesize",
      tier: NODE_TIER.synthesize,
      system: SYSTEM(),
      temperature: 0.5,
      emit: reasoningEmit(ctx, "synthesize"),
      signal: ctx.signal,
      usage: ctx.usage,
      deadlineAt: ctx.deadlineAt,
      user: fill(getPrompt("synthesize"), {
        requirements: state.requirements.join("; ") || "(see posting)",
        webFindings: state.webFindings ?? "(none)",
        evidence: ev,
      }),
    });
    draft = text;
  } catch (err) {
    // Degrade: hand compose a plain evidence summary rather than killing the run.
    if (process.env.AGENT_DEBUG) console.warn("[sully:synthesize] threw:", err instanceof Error ? err.message : err);
    draft = evidence.map((e) => `${e.label}: ${e.claim}`).join(" ");
  }
  return { update: { draft }, summary: "draft ready" };
});

// ── critique ─────────────────────────────────────────────────────────────────
export const critique = defineNode("critique", async (state, ctx) => {
  const evidence = dedupe(state.evidence);
  let ok = true;
  let gaps: string[] = [];
  try {
    const { json } = await streamChat({
      node: "critique",
      tier: NODE_TIER.critique,
      system: SYSTEM(),
      temperature: 0.3,
      jsonTail: true,
      emit: reasoningEmit(ctx, "critique"),
      signal: ctx.signal,
      usage: ctx.usage,
      deadlineAt: ctx.deadlineAt,
      user: withJsonTail(
        fill(getPrompt("critique"), {
          requirements: state.requirements.join("; ") || "(see posting)",
          draft: state.draft ?? "(none)",
          evidence: evidence.map((e) => `- ${e.label} (${e.href})`).join("\n") || "(none)",
        }),
      ),
    });
    const obj = (json ?? {}) as { ok?: unknown; gaps?: unknown };
    ok = obj.ok !== false; // default to ok unless explicitly false
    gaps = asStringArray(obj.gaps);
  } catch {
    ok = true; // degrade: don't loop forever if the critic is unavailable
  }

  // Bounded to ONE extra re-gather, and only if there's time left in the route's
  // 60s budget — a biased-yes agent rarely needs more, and finishing beats looping.
  const elapsed = Date.now() - ctx.startedAt;
  const willLoop = !ok && state.pass < 1 && elapsed < SOFT_LOOP_BUDGET_MS;
  if (willLoop) {
    // state.pass is 0 during the first pass, which we label "pass 1" to the
    // client; the one allowed re-gather is 0 + 2 = "pass 2".
    ctx.emit({ type: "loop", pass: state.pass + 2 });
    ctx.emit({ type: "edge", from: "critique", to: "plan" });
  }
  return {
    update: {
      critiqueResult: { ok, gaps },
      pass: willLoop ? state.pass + 1 : state.pass,
      loopBack: willLoop,
    },
    summary: ok ? "grounded — no gaps" : willLoop ? `re-gathering (${gaps.length} gaps)` : "proceeding",
  };
});

// ── compose ──────────────────────────────────────────────────────────────────
export const compose = defineNode("compose", async (state, ctx) => {
  const verdict: FitVerdict = state.verdict ?? "plausible";

  if (verdict === "not_a_fit") {
    let paragraph: string;
    try {
      const { text } = await streamChat({
        node: "compose",
        tier: NODE_TIER.compose,
        system: SYSTEM(),
        temperature: 0.5,
        emit: reasoningEmit(ctx, "compose"),
        signal: ctx.signal,
        usage: ctx.usage,
      deadlineAt: ctx.deadlineAt,
        user: fill(getPrompt("compose_decline"), {
          reason: state.gateReason ?? "it's outside his technical background",
        }),
      });
      paragraph = text.trim();
    } catch (err) {
      if (process.env.AGENT_DEBUG) console.warn("[sully:compose] decline threw:", err instanceof Error ? err.message : err);
      paragraph =
        "This one isn't a fit — it sits outside Manan's wheelhouse. He's a software / AI-native engineer who ships real systems, so if there's an adjacent technical need, that's where he'd shine.";
    }
    const result: FitResult = {
      verdict,
      paragraph,
      evidence: [{ label: "what Manan actually builds", href: "#work" }],
      company: state.company,
    };
    return { update: { result }, summary: "declined" };
  }

  const evidence = dedupe(state.evidence);
  // compose now returns the paragraph as PLAIN text (matches the prompt). The
  // cited evidence shown is the curated set the gather nodes already selected.
  let paragraph: string;
  try {
    const { text } = await streamChat({
      node: "compose",
      tier: NODE_TIER.compose,
      system: SYSTEM(),
      temperature: 0.5,
      emit: reasoningEmit(ctx, "compose"),
      signal: ctx.signal,
      usage: ctx.usage,
      deadlineAt: ctx.deadlineAt,
      user: fill(getPrompt("compose"), {
        verdict,
        draft: state.draft ?? "(none)",
        evidence: evidence.map((e) => `- ${e.label} (${e.href}): ${e.claim}`).join("\n") || "(none)",
      }),
    });
    paragraph = text.trim();
  } catch (err) {
    // Degrade: never let compose kill the run — fall back to the synthesized draft.
    if (process.env.AGENT_DEBUG) console.warn("[sully:compose] threw:", err instanceof Error ? err.message : err);
    paragraph =
      state.draft && state.draft.length > 60
        ? state.draft
        : `Manan is a ${verdict} fit for this role, backed by ${evidence.slice(0, 3).map((e) => e.label).join(", ") || "his shipped work"}.`;
  }
  // Grounding by construction: surface the evidence the gather nodes curated
  // (deduped, capped) — every item is a real, selected corpus pick.
  const chosen = evidence.slice(0, 6);
  const result: FitResult = {
    verdict,
    paragraph,
    evidence: chosen.map((e) => ({ label: e.label, href: e.href })),
    company: state.company,
  };
  return { update: { result }, summary: verdict.replace("_", " ") };
});

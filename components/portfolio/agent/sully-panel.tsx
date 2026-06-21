"use client";

import { useReducer, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { runFitAssessment } from "./run-fit-assessment";
import { runExample } from "./example-run";
import { AgentGraph, type NodeStatus } from "./agent-graph";
import {
  AgentRestingError,
  NODE_LABELS,
  type AgentEvent,
  type FitResult,
  type NodeId,
} from "./agent-types";

const AGENT = "Sully";
const NODE_ORDER: NodeId[] = [
  "intake",
  "fit_gate",
  "plan",
  "work_history",
  "projects",
  "web_corpus",
  "synthesize",
  "critique",
  "compose",
];

const VERDICT: Record<FitResult["verdict"], { label: string; color: string }> = {
  strong: { label: "strong fit", color: "var(--ok)" },
  plausible: { label: "plausible fit", color: "var(--accent)" },
  not_a_fit: { label: "not a fit", color: "var(--negative)" },
};

type Phase = "idle" | "running" | "done" | "error";
interface ViewState {
  nodes: Record<NodeId, NodeStatus>;
  reasoning: Record<NodeId, string>;
  detail: Partial<Record<NodeId, string>>;
  summary: Partial<Record<NodeId, string>>;
  order: NodeId[];
  active: NodeId | null;
  pass: number;
  phase: Phase;
  mode: "live" | "example";
  resting: boolean;
  result: FitResult | null;
  error: string | null;
}

function idleNodes(): Record<NodeId, NodeStatus> {
  return Object.fromEntries(NODE_ORDER.map((n) => [n, "idle"])) as Record<NodeId, NodeStatus>;
}

function fresh(mode: "live" | "example", resting = false): ViewState {
  return {
    nodes: idleNodes(),
    reasoning: {} as Record<NodeId, string>,
    detail: {},
    summary: {},
    order: [],
    active: null,
    pass: 0,
    phase: "running",
    mode,
    resting,
    result: null,
    error: null,
  };
}

type Action =
  | { kind: "start"; mode: "live" | "example"; resting?: boolean }
  | { kind: "event"; ev: AgentEvent }
  | { kind: "result"; result: FitResult }
  | { kind: "error"; message: string }
  | { kind: "reset" };

function reducer(state: ViewState, action: Action): ViewState {
  switch (action.kind) {
    case "reset":
      return { ...fresh("live"), phase: "idle" };
    case "start":
      return fresh(action.mode, action.resting ?? false);
    case "result":
      return { ...state, phase: "done", result: action.result, active: null };
    case "error":
      return { ...state, phase: "error", error: action.message, active: null };
    case "event": {
      const ev = action.ev;
      const s = { ...state, nodes: { ...state.nodes } };
      switch (ev.type) {
        case "node_start":
          s.nodes[ev.node] = "running";
          s.active = ev.node;
          if (!s.order.includes(ev.node)) s.order = [...s.order, ev.node];
          return s;
        case "node_reasoning":
          s.reasoning = { ...s.reasoning, [ev.node]: (s.reasoning[ev.node] ?? "") + ev.delta };
          return s;
        case "node_status":
          s.detail = { ...s.detail, [ev.node]: ev.detail };
          return s;
        case "node_done":
          s.nodes[ev.node] = "done";
          if (ev.summary) s.summary = { ...s.summary, [ev.node]: ev.summary };
          return s;
        case "node_skipped":
          s.nodes[ev.node] = "skipped";
          if (!s.order.includes(ev.node)) s.order = [...s.order, ev.node];
          return s;
        case "node_error":
          s.nodes[ev.node] = "error";
          return s;
        case "loop":
          s.pass = ev.pass;
          return s;
        default:
          return s; // edge — the graph derives those from states/pass
      }
    }
  }
}

export function SullyPanel() {
  const [input, setInput] = useState("");
  const [state, dispatch] = useReducer(reducer, { ...fresh("live"), phase: "idle" });
  const running = state.phase === "running";

  async function drive(gen: AsyncGenerator<AgentEvent, FitResult, void>) {
    let next = await gen.next();
    while (!next.done) {
      dispatch({ kind: "event", ev: next.value });
      next = await gen.next();
    }
    dispatch({ kind: "result", result: next.value });
  }

  async function runLive() {
    dispatch({ kind: "start", mode: "live" });
    try {
      await drive(runFitAssessment(input.trim() || "Software / AI engineer"));
    } catch (err) {
      if (err instanceof AgentRestingError) {
        dispatch({ kind: "start", mode: "example", resting: true });
        await drive(runExample());
      } else {
        dispatch({ kind: "error", message: err instanceof Error ? err.message : "agent unavailable" });
      }
    }
  }

  async function playExample() {
    dispatch({ kind: "start", mode: "example" });
    await drive(runExample());
  }

  const liveLabel = state.mode === "example";

  return (
    <div className="sully-stage rounded-2xl border p-5 font-body text-ink sm:p-7">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!running) runLive();
        }}
      >
        <label htmlFor="jd" className="sr-only">
          Paste a job description or a role you&rsquo;re hiring for
        </label>
        <input
          id="jd"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="paste a job description or a role you're hiring for…"
          className="flex-1 rounded-lg border border-rule bg-paper px-4 py-3 font-mono text-sm text-ink placeholder:text-faint focus:border-accent"
        />
        <button
          type="submit"
          disabled={running}
          className={`neon-btn shrink-0 rounded-lg bg-accent px-5 py-3 font-mono text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 ${running ? "cursor-wait opacity-60" : ""}`}
        >
          {running ? `${AGENT} is working…` : `Ask ${AGENT}`}
        </button>
      </form>

      {/* the live flow graph — horizontal on desktop, vertical on phones */}
      <div className="mt-7 opacity-100" style={{ opacity: state.phase === "idle" ? 0.55 : 1 }}>
        <div className="hidden sm:block">
          <AgentGraph nodes={state.nodes} pass={state.pass} orientation="h" />
        </div>
        <div className="mx-auto block max-w-[15rem] sm:hidden">
          <AgentGraph nodes={state.nodes} pass={state.pass} orientation="v" />
        </div>
      </div>

      {/* idle hint */}
      {state.phase === "idle" && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-center font-mono text-[0.7rem] text-faint">
          <span>a real multi-step agent — paste a role and watch it run.</span>
          <button type="button" onClick={playExample} className="text-accent underline underline-offset-2">
            see an example
          </button>
        </div>
      )}

      {/* resting / example banner */}
      {liveLabel && state.phase !== "idle" && (
        <p className="mt-2 text-center font-mono text-[0.65rem] uppercase tracking-[0.14em] text-attention">
          {state.resting ? "live demo is resting — showing a recent example" : "example run"}
        </p>
      )}

      {/* the thinking stream */}
      {state.order.length > 0 && (
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto border-t border-rule pt-4" aria-live="polite">
          {state.order.map((n) => {
            const st = state.nodes[n];
            const isActive = state.active === n && running;
            const dot = st === "done" ? "var(--accent)" : st === "error" ? "var(--negative)" : st === "skipped" ? "var(--faint)" : "var(--accent)";
            return (
              <div key={n} className="font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
                  <span className="text-ink">{NODE_LABELS[n]}</span>
                  {state.detail[n] && <span className="text-faint">· {state.detail[n]}</span>}
                  {!isActive && state.summary[n] && <span className="text-faint">· {state.summary[n]}</span>}
                  {st === "skipped" && <span className="text-faint">· skipped</span>}
                </div>
                {isActive && state.reasoning[n] && (
                  <p className="mt-1 pl-3.5 font-body text-[0.85rem] leading-relaxed text-muted">
                    {state.reasoning[n]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* error */}
      {state.phase === "error" && (
        <p className="mt-4 border-t border-rule pt-4 font-mono text-xs text-negative">
          Sully hit a snag: {state.error}. Try again in a moment.
        </p>
      )}

      {/* result */}
      <AnimatePresence>
        {state.result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mt-4 border-t border-rule pt-5"
          >
            <span
              className="inline-flex rounded-full px-3 py-0.5 font-mono text-[0.7rem] uppercase tracking-[0.14em]"
              style={{ color: VERDICT[state.result.verdict].color, background: "var(--accent-soft)" }}
            >
              {VERDICT[state.result.verdict].label}
            </span>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-ink">{state.result.paragraph}</p>
            {state.result.evidence.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {state.result.evidence.map((ev) => (
                  <a
                    key={ev.href}
                    href={ev.href}
                    className="font-mono text-xs text-accent underline underline-offset-2"
                  >
                    {ev.label}
                  </a>
                ))}
              </div>
            )}
            {liveLabel && (
              <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-faint">
                example output — not a live run
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { runFitAssessment } from "./run-fit-assessment";
import { runExample } from "./example-run";
import { AgentGraph, type NodeStatus } from "./agent-graph";
import { ThinkingStream } from "./thinking-stream";
import { AgentRestingError, type AgentEvent, type FitResult, type NodeId } from "./agent-types";

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
  | { kind: "reasoning"; chunks: Partial<Record<NodeId, string>> }
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
    case "reasoning": {
      const reasoning = { ...state.reasoning };
      for (const [k, v] of Object.entries(action.chunks)) {
        const n = k as NodeId;
        reasoning[n] = (reasoning[n] ?? "") + v;
      }
      return { ...state, reasoning };
    }
    case "event": {
      const ev = action.ev;
      const s = { ...state, nodes: { ...state.nodes } };
      switch (ev.type) {
        case "node_start":
          s.nodes[ev.node] = "running";
          s.active = ev.node;
          if (!s.order.includes(ev.node)) s.order = [...s.order, ev.node];
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
          return s; // node_reasoning handled via throttle; edge derived from state
      }
    }
  }
}

export function SullyPanel() {
  const [input, setInput] = useState("");
  const [state, dispatch] = useReducer(reducer, { ...fresh("live"), phase: "idle" });
  const running = state.phase === "running";

  // Throttle high-frequency reasoning deltas to ~one flush per animation frame.
  const pending = useRef<Partial<Record<NodeId, string>>>({});
  const raf = useRef<number | null>(null);
  function flush() {
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    if (Object.keys(pending.current).length) {
      const chunks = pending.current;
      pending.current = {};
      dispatch({ kind: "reasoning", chunks });
    }
  }
  function schedule() {
    if (raf.current == null) raf.current = requestAnimationFrame(flush);
  }
  useEffect(() => () => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
  }, []);

  async function drive(gen: AsyncGenerator<AgentEvent, FitResult, void>) {
    pending.current = {};
    let next = await gen.next();
    while (!next.done) {
      const ev = next.value;
      if (ev.type === "node_reasoning") {
        pending.current[ev.node] = (pending.current[ev.node] ?? "") + ev.delta;
        schedule();
      } else {
        flush();
        dispatch({ kind: "event", ev });
      }
      next = await gen.next();
    }
    flush();
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

  const isExample = state.mode === "example";
  const showStage = state.phase !== "idle";

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
          className="flex-1 rounded-lg border border-rule bg-paper px-4 py-3 font-mono text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={running}
          className={`neon-btn shrink-0 rounded-lg bg-accent px-5 py-3 font-mono text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 ${running ? "cursor-wait opacity-60" : ""}`}
        >
          {running ? `${AGENT} is working…` : `Ask ${AGENT}`}
        </button>
      </form>

      {/* idle: a dimmed graph at rest + the one-line hint */}
      {state.phase === "idle" && (
        <>
          <div className="mt-7 opacity-50">
            <div className="hidden sm:block">
              <AgentGraph nodes={state.nodes} orientation="h" />
            </div>
            <div className="mx-auto block max-w-[15rem] sm:hidden">
              <AgentGraph nodes={state.nodes} orientation="v" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-center font-mono text-[0.7rem] text-faint">
            <span>a real multi-step agent — paste a role and watch it run.</span>
            <button type="button" onClick={playExample} className="text-accent underline underline-offset-2">
              see an example
            </button>
          </div>
        </>
      )}

      {/* running / done: two regions — the graph and the live thinking */}
      {showStage && (
        <>
          {isExample && (
            <p className="mt-3 text-center font-mono text-[0.65rem] uppercase tracking-[0.14em] text-attention">
              {state.resting ? "live demo is resting — showing a recent example" : "example run"}
            </p>
          )}
          <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-7">
            <div className="self-start">
              <div className="hidden sm:block">
                <AgentGraph nodes={state.nodes} pass={state.pass} orientation="h" />
              </div>
              <div className="mx-auto block max-w-[14rem] sm:hidden">
                <AgentGraph nodes={state.nodes} pass={state.pass} orientation="v" />
              </div>
            </div>
            <div className="border-t border-rule pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <ThinkingStream
                order={state.order}
                nodes={state.nodes}
                reasoning={state.reasoning}
                detail={state.detail}
                summary={state.summary}
                active={state.active}
                running={running}
              />
            </div>
          </div>
        </>
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
            className="mt-5 border-t border-rule pt-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className="inline-flex rounded-full px-3 py-0.5 font-mono text-[0.7rem] uppercase tracking-[0.14em]"
                style={{ color: VERDICT[state.result.verdict].color, background: "var(--accent-soft)" }}
              >
                {VERDICT[state.result.verdict].label}
              </span>
              <button
                type="button"
                onClick={() => dispatch({ kind: "reset" })}
                className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-faint transition-colors hover:text-accent"
              >
                run another →
              </button>
            </div>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-ink">{state.result.paragraph}</p>
            {state.result.evidence.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {state.result.evidence.map((ev) => (
                  <a key={ev.href} href={ev.href} className="font-mono text-xs text-accent underline underline-offset-2">
                    {ev.label}
                  </a>
                ))}
              </div>
            )}
            {isExample && (
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

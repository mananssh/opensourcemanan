/**
 * The Sully agent contract. This module is imported by the client (SullyPanel)
 * and MUST stay free of any server/node code — it is pure types plus the
 * client-side stream reader (see run-fit-assessment.ts).
 *
 * Phase 1 shipped a stubbed generator behind `runFitAssessment`. Phase 2 swaps
 * only the generator's body (a real NDJSON stream from the LangGraph.js agent)
 * and ENRICHES the event union below. `FitResult`/`Evidence`/`FitVerdict` are
 * unchanged from Phase 1 — byte-for-byte — so the result card never moved.
 */

export type FitVerdict = "strong" | "plausible" | "not_a_fit";

export interface Evidence {
  label: string;
  href: string; // anchor to a real section / project / experience permalink
}

export interface FitResult {
  verdict: FitVerdict;
  paragraph: string; // the one-paragraph case (or an honest decline)
  evidence: Evidence[];
  company?: string;
}

/** The nine real nodes of the graph (see lib/agent/graph.ts). */
export type NodeId =
  | "intake"
  | "fit_gate"
  | "plan"
  | "work_history"
  | "projects"
  | "web_corpus"
  | "synthesize"
  | "critique"
  | "compose";

/**
 * The streamed event union. The route handler derives these from a real run and
 * the client renders them live — the lighting-up graph (transitions) and the
 * thinking stream (reasoning deltas). Never faked or pre-scripted.
 */
export type AgentEvent =
  | { type: "node_start"; node: NodeId; label: string }
  | { type: "node_reasoning"; node: NodeId; delta: string } // streamed thinking text
  | { type: "node_status"; node: NodeId; detail: string } // e.g. "searching: Kello" / "3 sources"
  | { type: "node_done"; node: NodeId; summary?: string }
  | { type: "node_skipped"; node: NodeId; reason?: string }
  | { type: "edge"; from: NodeId; to: NodeId } // only for the off-diagram jumps (decline / loop)
  | { type: "loop"; pass: number } // critique → re-gather, 2nd pass etc.
  | { type: "node_error"; node: NodeId; message: string }
  | { type: "result"; result: FitResult }
  | { type: "error"; message: string };

/** Human labels for each node — shared by the client graph + thinking stream. */
export const NODE_LABELS: Record<NodeId, string> = {
  intake: "intake",
  fit_gate: "fit gate",
  plan: "plan",
  work_history: "work history",
  projects: "projects",
  web_corpus: "web corpus",
  synthesize: "synthesize",
  critique: "critique",
  compose: "compose",
};

/** Thrown by runFitAssessment when the public daily cap is hit (show the example). */
export class AgentRestingError extends Error {
  constructor(message = "the live demo is resting") {
    super(message);
    this.name = "AgentRestingError";
  }
}

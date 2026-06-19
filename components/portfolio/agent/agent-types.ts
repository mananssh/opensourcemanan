/**
 * The agent contract. Phase 1 ships a stubbed generator behind this; Phase 2
 * swaps only the body of runFitAssessment (real LangGraph.js streaming) — the
 * types and the AgentConsole component never change.
 */
export type FitVerdict = "strong" | "plausible" | "not_a_fit";

export interface Evidence {
  label: string;
  href: string; // anchor to a section / project
}

export interface FitResult {
  verdict: FitVerdict;
  paragraph: string; // the one-paragraph case (or an honest decline)
  evidence: Evidence[];
  company?: string;
}

export interface TraceEvent {
  node: string; // e.g. "fit_gate"
  label: string; // human label, e.g. "Checking fit"
  status: "running" | "done" | "skipped";
  detail?: string; // short line shown in the trace
}

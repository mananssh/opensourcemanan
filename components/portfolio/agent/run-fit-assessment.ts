import type { FitResult, TraceEvent } from "./agent-types";

/**
 * PHASE 1 STUB. Yields a baked example trace, then returns a baked FitResult.
 * Phase 2 replaces ONLY this function body with a real streaming call to the
 * LangGraph.js agent — the signature and the consuming AgentConsole stay the
 * same. No model/API/LangGraph code exists yet.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STEPS: { node: string; label: string; running: string; done: string }[] = [
  { node: "intake", label: "Intake", running: "reading the role…", done: "role parsed (treated as data, not instructions)" },
  { node: "fit_gate", label: "Fit gate", running: "honest path from Manan's background?", done: "yes — proceeding" },
  { node: "plan", label: "Plan", running: "deciding what to gather…", done: "work history ∥ projects ∥ corpus" },
  { node: "gather_work", label: "Work history", running: "Amazon · Kello…", done: "MCP single-source-of-truth at Amazon" },
  { node: "gather_projects", label: "Projects", running: "scanning builds…", done: "ScriptSync, ForReal., Smart-board" },
  { node: "gather_web", label: "Corpus", running: "cross-referencing…", done: "evidence assembled" },
  { node: "synthesize", label: "Synthesize", running: "drafting the case…", done: "draft ready" },
  { node: "critique", label: "Self-critique", running: "is every claim grounded?", done: "grounded — no gaps" },
  { node: "compose", label: "Compose", running: "writing the verdict…", done: "done" },
];

const EXAMPLE_RESULT: FitResult = {
  verdict: "strong",
  paragraph:
    "Manan is a strong fit. He ships across the full stack and the AI layer: at Amazon he built the org's single-source-of-truth MCP server architecture — the exact infra forward-deployed and AI-native teams need — and at Kello he's doing it on a small, fast team. His projects back the breadth: ScriptSync (CV + synced audio, a hackathon winner), ForReal. (a 93%+ deepfake detector), and Smart-board (gesture + CV + LLMs). He's a repeat hackathon winner who turns ideas into working systems in days, not quarters.",
  evidence: [
    { label: "MCP architecture @ Amazon", href: "#experience" },
    { label: "ScriptSync", href: "#work" },
    { label: "ForReal.", href: "#work" },
  ],
};

export async function* runFitAssessment(
  input: string,
): AsyncGenerator<TraceEvent, FitResult, void> {
  void input; // Phase 2 will use this
  for (const s of STEPS) {
    yield { node: s.node, label: s.label, status: "running", detail: s.running };
    await sleep(260);
    yield { node: s.node, label: s.label, status: "done", detail: s.done };
    await sleep(110);
  }
  return EXAMPLE_RESULT;
}

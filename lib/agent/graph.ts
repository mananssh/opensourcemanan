import "server-only";
import { END, START, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state";
import {
  intake,
  fitGate,
  plan,
  workHistory,
  projects,
  webCorpus,
  synthesize,
  critique,
  compose,
} from "./nodes";

/**
 * Sully's graph (matches the architecture diagram exactly):
 *
 *   intake → fit_gate ─(not_a_fit)─────────────► compose (decline)
 *                 │ (strong / plausible)
 *                 ▼
 *               plan ──► ┌ work_history ┐
 *                        ├ projects     ┤ (parallel) ─► synthesize ─► critique ─► compose
 *                        └ web_corpus   ┘                                 │
 *                                            ▲──────── re-gather (≤2) ─────┘
 *
 * Two conditional edges: the gate's decline short-circuit, and the bounded
 * critique loop (back to `plan`, which re-fans the band). The parallel band is a
 * fan-out (plan → three nodes) joined at synthesize by a barrier edge.
 */
const builder = new StateGraph(AgentState)
  .addNode("intake", intake)
  .addNode("fit_gate", fitGate)
  .addNode("plan", plan)
  .addNode("work_history", workHistory)
  .addNode("projects", projects)
  .addNode("web_corpus", webCorpus)
  .addNode("synthesize", synthesize)
  .addNode("critique", critique)
  .addNode("compose", compose)
  .addEdge(START, "intake")
  .addEdge("intake", "fit_gate")
  .addConditionalEdges("fit_gate", (s) => (s.verdict === "not_a_fit" ? "compose" : "plan"), {
    plan: "plan",
    compose: "compose",
  })
  .addEdge("plan", "work_history")
  .addEdge("plan", "projects")
  .addEdge("plan", "web_corpus")
  .addEdge(["work_history", "projects", "web_corpus"], "synthesize")
  .addEdge("synthesize", "critique")
  .addConditionalEdges("critique", (s) => (s.loopBack ? "plan" : "compose"), {
    plan: "plan",
    compose: "compose",
  })
  .addEdge("compose", END);

export const graph = builder.compile();

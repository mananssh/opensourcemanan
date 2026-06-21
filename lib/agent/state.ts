import "server-only";
import { Annotation } from "@langchain/langgraph";
import type { FitResult, FitVerdict } from "@/components/portfolio/agent/agent-types";

/**
 * A piece of evidence selected from the real corpus. Built from a DB row, so the
 * `href` is a permalink that is guaranteed to resolve — citations are grounded
 * by construction (compose may only cite from accumulated EvidenceItems).
 */
export interface EvidenceItem {
  label: string; // short display label, e.g. "MCP architecture @ Amazon"
  claim: string; // the specific true thing this supports
  href: string; // /work/[slug] · /hackathons/[slug] · /experience/[id] · #work · #experience
  source: "work_history" | "projects" | "web_corpus";
}

export interface Critique {
  ok: boolean;
  gaps: string[];
}

/**
 * The typed graph state. The `evidence` channel uses a concat reducer because
 * the three gather nodes write to it concurrently (the parallel band); we dedupe
 * by href in synthesize. Everything else is last-write-wins.
 */
export const AgentState = Annotation.Root({
  input: Annotation<string>(),
  company: Annotation<string | undefined>(),
  role: Annotation<string | undefined>(),
  requirements: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  verdict: Annotation<FitVerdict | undefined>(),
  gateReason: Annotation<string | undefined>(),
  // Channel names must NOT collide with node names (LangGraph 1.x), so the
  // `plan`/`critique` nodes write to `planDimensions`/`critiqueResult`.
  planDimensions: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  evidence: Annotation<EvidenceItem[]>({
    reducer: (prev, next) => prev.concat(next),
    default: () => [],
  }),
  webFindings: Annotation<string | undefined>(),
  draft: Annotation<string | undefined>(),
  critiqueResult: Annotation<Critique | undefined>(),
  pass: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
  loopBack: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  result: Annotation<FitResult | undefined>(),
});

export type AgentStateType = typeof AgentState.State;

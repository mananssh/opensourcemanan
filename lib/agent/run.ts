import "server-only";
import type { AgentEvent } from "@/components/portfolio/agent/agent-types";
import { graph } from "./graph";
import { loadCorpus } from "./corpus";
import { createEventStream } from "./events";
import { RUN_DEADLINE_MS } from "./nodes";
import { warmPrompts } from "./prompts";

/**
 * Run the real agent and yield its events as they happen. The graph runs
 * concurrently with the drain: nodes `emit()` into the bus (threaded via
 * `configurable.ctx`), the bus yields here, and the route turns each event into
 * an NDJSON line. The final `result` event carries the FitResult.
 */
export async function* streamFitAssessment(
  input: string,
  signal?: AbortSignal,
): AsyncGenerator<AgentEvent, void, void> {
  // Warm the prompt cache (R2/env) alongside the corpus so getPrompt is sync in the graph.
  const [corpus] = await Promise.all([loadCorpus(), warmPrompts()]);
  const { emit, close, drain } = createEventStream();
  const startedAt = Date.now();
  const deadlineAt = startedAt + RUN_DEADLINE_MS;

  // Run-scoped model/token telemetry, surfaced as a final `usage` event.
  let tokens = 0;
  let calls = 0;
  const models = new Set<string>();
  const usage = {
    add(t: number, model: string) {
      tokens += t;
      calls += 1;
      models.add(model);
    },
  };

  const run = graph
    .invoke(
      { input },
      { configurable: { ctx: { emit, corpus, signal, startedAt, deadlineAt, usage } }, recursionLimit: 50, signal },
    )
    .then((final) => {
      if (models.size) emit({ type: "usage", model: [...models].join(", "), tokens, calls });
      if (final.result) emit({ type: "result", result: final.result });
      else emit({ type: "error", message: "no result produced" });
    })
    .catch((err) => {
      emit({ type: "error", message: err instanceof Error ? err.message : String(err) });
    })
    .finally(() => close());

  yield* drain();
  await run;
}

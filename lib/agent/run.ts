import "server-only";
import type { AgentEvent } from "@/components/portfolio/agent/agent-types";
import { graph } from "./graph";
import { loadCorpus } from "./corpus";
import { createEventStream } from "./events";

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
  const corpus = await loadCorpus();
  const { emit, close, drain } = createEventStream();

  const run = graph
    .invoke(
      { input },
      { configurable: { ctx: { emit, corpus, signal } }, recursionLimit: 50, signal },
    )
    .then((final) => {
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

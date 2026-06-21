import { AgentRestingError, type AgentEvent, type FitResult } from "./agent-types";

/**
 * PHASE 2. Calls the real LangGraph.js agent at /api/fit and parses its NDJSON
 * stream, yielding each `AgentEvent` as it arrives and returning the final
 * `FitResult`. The signature is unchanged from the Phase 1 stub — SullyPanel
 * still just drives this generator. A 429 (daily cap) throws `AgentRestingError`
 * so the UI can fall back to the labeled example.
 */
export async function* runFitAssessment(
  input: string,
): AsyncGenerator<AgentEvent, FitResult, void> {
  const res = await fetch("/api/fit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input }),
  });
  if (res.status === 429) throw new AgentRestingError();
  if (!res.ok || !res.body) throw new Error("agent unavailable");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let result: FitResult | null = null;

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const ev = JSON.parse(line) as AgentEvent;
      if (ev.type === "result") result = ev.result;
      else if (ev.type === "error") throw new Error(ev.message);
      else yield ev;
    }
  }
  if (!result) throw new Error("no result");
  return result;
}

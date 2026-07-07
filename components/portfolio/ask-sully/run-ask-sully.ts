import { AskRestingError, type AskEvent, type ChatMessage, type PageContext } from "./ask-types";

/**
 * Calls /api/ask and parses its NDJSON stream, yielding each `AskEvent` as it
 * arrives. Mirrors `run-fit-assessment.ts`'s client-boundary shape. A 429
 * (daily/hourly cap) throws `AskRestingError` so the UI can show a friendly
 * "resting" message instead of a raw error.
 */
export async function* runAskSully(
  messages: ChatMessage[],
  pageContext?: PageContext,
): AsyncGenerator<AskEvent, void, void> {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, pageContext }),
  });
  if (res.status === 429) throw new AskRestingError();
  if (!res.ok || !res.body) throw new Error("Sully is unavailable");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const ev = JSON.parse(line) as AskEvent;
      if (ev.type === "error") throw new Error(ev.message);
      yield ev;
    }
  }
}

import "server-only";
import { createEventStream } from "@/lib/agent/events";
import { streamChat } from "@/lib/agent/model-router";
import { warmPrompts } from "@/lib/agent/prompts";
import type { AskEvent, ChatMessage, PageContext } from "@/components/portfolio/ask-sully/ask-types";
import { loadCachedCorpus } from "./corpus-cache";
import { truncateHistory } from "./history";
import { buildAskPrompt } from "./prompt";

/** A single completion's worst case is bounded by lane failover against the idle-timeout; capped hard here. */
export const ASK_DEADLINE_MS = Number(process.env.AGENT_ASK_DEADLINE_MS ?? 20_000);

/**
 * One scoped `streamChat` call per turn — no LangGraph, no `jsonTail`. A
 * "what's this section about" chat answer doesn't need a multi-step research
 * graph the way a full fit assessment does.
 */
export async function* streamAskAnswer(
  messages: ChatMessage[],
  pageContext: PageContext | undefined,
  signal?: AbortSignal,
): AsyncGenerator<AskEvent, void, void> {
  const [corpus] = await Promise.all([loadCachedCorpus(), warmPrompts()]);
  const { emit, close, drain } = createEventStream<AskEvent>();
  const deadlineAt = Date.now() + ASK_DEADLINE_MS;
  const { system, user } = buildAskPrompt(corpus, truncateHistory(messages), pageContext);

  const run = streamChat({
    node: "ask",
    tier: "fast",
    system,
    user,
    signal,
    deadlineAt,
    temperature: 0.4,
    maxTokens: 300, // 2-4 sentence answers with headroom so they never clip mid-sentence
    emit: (delta) => emit({ type: "delta", text: delta }),
  })
    .then(() => emit({ type: "done" }))
    .catch((err) => emit({ type: "error", message: err instanceof Error ? err.message : String(err) }))
    .finally(() => close());

  yield* drain();
  await run;
}

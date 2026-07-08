import type { NextRequest } from "next/server";
import { streamAskAnswer } from "@/lib/agent/ask/run-ask";
import { hasModelLane } from "@/lib/agent/model-router";
import { checkAndReserve, clientIp, hashInput, hashIp, finishRun, MAX_ASK_INPUT_CHARS } from "@/lib/agent/ask/rate-limit";
import type { ChatMessage, PageContext } from "@/components/portfolio/ask-sully/ask-types";

/**
 * Ask Sully — a lightweight, general "ask about Manan" chat. Mirrors
 * `/api/fit`'s NDJSON-streaming shape, but for one scoped completion per turn
 * instead of a 9-node graph, so a much smaller `maxDuration` suffices.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_PAGE_CONTEXT_CHARS = 4000;
// Bound the array before we walk/trim it — a client could otherwise POST a huge
// history and burn CPU pre-truncation. Server-side history keeps only the last 8
// turns anyway (~16 messages); 40 is generous headroom.
const MAX_MESSAGES = 40;

function bad(message: string): Response {
  return new Response(JSON.stringify({ error: "bad_request", message }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

function parseMessages(v: unknown): ChatMessage[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > MAX_MESSAGES) return null;
  const messages: ChatMessage[] = [];
  for (const m of v) {
    const role = (m as { role?: unknown })?.role;
    const content = (m as { content?: unknown })?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) return null;
    // Cap every message, not just the last — a huge prior turn would otherwise slip past the last-message check.
    if (content.length > MAX_ASK_INPUT_CHARS) return null;
    messages.push({ role, content: content.trim() });
  }
  return messages;
}

function parsePageContext(v: unknown): PageContext | undefined {
  if (!v || typeof v !== "object") return undefined;
  const title = (v as { title?: unknown }).title;
  const path = (v as { path?: unknown }).path;
  const text = (v as { text?: unknown }).text;
  if (typeof title !== "string" || typeof path !== "string" || typeof text !== "string") return undefined;
  // Never trust client-side truncation — cap again here regardless.
  return { title: title.slice(0, 200), path: path.slice(0, 200), text: text.slice(0, MAX_PAGE_CONTEXT_CHARS) };
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("invalid JSON body");
  }

  const messages = parseMessages((body as { messages?: unknown })?.messages);
  if (!messages) return bad("messages must be a non-empty array of {role, content}");
  const last = messages[messages.length - 1]!;
  if (last.role !== "user") return bad("the last message must be from the user");
  if (last.content.length > MAX_ASK_INPUT_CHARS) return bad(`message too long (max ${MAX_ASK_INPUT_CHARS} chars)`);
  const pageContext = parsePageContext((body as { pageContext?: unknown })?.pageContext);

  if (!hasModelLane()) {
    return new Response(
      JSON.stringify({ error: "capped", reason: "no_model", message: "Sully is resting" }),
      { status: 429, headers: { "content-type": "application/json" } },
    );
  }

  const ipHash = hashIp(clientIp(request.headers));
  const inputHash = hashInput(last.content);

  const decision = await checkAndReserve(ipHash, inputHash);
  if (!decision.allowed) {
    await finishRun(null, { ipHash, inputHash, capped: true });
    return new Response(
      JSON.stringify({ error: "capped", reason: decision.reason, message: "Sully is resting" }),
      { status: 429, headers: { "content-type": "application/json" } },
    );
  }
  const { runId } = decision;

  const started = Date.now();
  const encoder = new TextEncoder();
  const events = streamAskAnswer(messages, pageContext, request.signal);

  let errored: string | null = null;
  let logged = false;
  const finish = async () => {
    if (logged) return;
    logged = true;
    await finishRun(runId, { ipHash, inputHash, durationMs: Date.now() - started, error: errored });
  };

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await events.next();
        if (done) {
          await finish();
          controller.close();
          return;
        }
        if (value.type === "error") errored = value.message;
        controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
      } catch (err) {
        errored = err instanceof Error ? err.message : String(err);
        await finish();
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", message: errored })}\n`));
        controller.close();
      }
    },
    async cancel() {
      await finish();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}

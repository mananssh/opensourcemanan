import type { NextRequest } from "next/server";
import { streamFitAssessment } from "@/lib/agent/run";
import { hasModelLane } from "@/lib/agent/model-router";
import {
  MAX_INPUT_CHARS,
  checkRateLimit,
  clientIp,
  hashInput,
  hashIp,
  logRun,
} from "@/lib/agent/rate-limit";

/**
 * The live Sully agent. Runs the LangGraph.js graph server-side and streams real
 * `AgentEvent`s as NDJSON (one JSON object per line). Node runtime + dynamic so
 * model keys stay server-only and nothing is cached. `maxDuration` covers a
 * multi-node run; per-node timeouts + lane failover keep us inside it.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function bad(message: string): Response {
  return new Response(JSON.stringify({ error: "bad_request", message }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("invalid JSON body");
  }
  const input = typeof (body as { input?: unknown })?.input === "string" ? (body as { input: string }).input.trim() : "";
  if (!input) return bad("empty input");
  if (input.length > MAX_INPUT_CHARS) return bad(`input too long (max ${MAX_INPUT_CHARS} chars)`);

  // No key configured anywhere → the demo is "resting"; the client shows the
  // labeled example replay instead of surfacing a raw error.
  if (!hasModelLane()) {
    return new Response(
      JSON.stringify({ error: "capped", reason: "no_model", message: "the live demo is resting" }),
      { status: 429, headers: { "content-type": "application/json" } },
    );
  }

  const ipHash = hashIp(clientIp(request.headers));
  const inputHash = hashInput(input);

  const decision = await checkRateLimit(ipHash);
  if (!decision.allowed) {
    await logRun({ ipHash, inputHash, capped: true });
    return new Response(
      JSON.stringify({ error: "capped", reason: decision.reason, message: "the live demo is resting" }),
      { status: 429, headers: { "content-type": "application/json" } },
    );
  }

  const started = Date.now();
  const encoder = new TextEncoder();
  const events = streamFitAssessment(input, request.signal);

  let verdict: string | null = null;
  let company: string | null = null;
  let errored: string | null = null;
  let logged = false;
  const finish = async () => {
    if (logged) return;
    logged = true;
    await logRun({ ipHash, inputHash, verdict, company, durationMs: Date.now() - started, error: errored });
  };

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await events.next();
        if (done) {
          controller.close();
          await finish();
          return;
        }
        if (value.type === "result") {
          verdict = value.result.verdict;
          company = value.result.company ?? null;
        } else if (value.type === "error") {
          errored = value.message;
        }
        controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
      } catch (err) {
        errored = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", message: errored })}\n`));
        controller.close();
        await finish();
      }
    },
    async cancel() {
      // Client disconnected — request.signal aborts the in-flight run.
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

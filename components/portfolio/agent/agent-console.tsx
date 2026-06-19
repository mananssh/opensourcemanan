"use client";

import { useEffect, useRef, useState } from "react";
import { runFitAssessment } from "./run-fit-assessment";
import type { FitResult, TraceEvent } from "./agent-types";
import { ScrambleText } from "@/components/portfolio/hero/scramble-text";

const VERDICT_LABEL: Record<FitResult["verdict"], string> = {
  strong: "strong fit",
  plausible: "plausible fit",
  not_a_fit: "not a fit",
};

export function AgentConsole() {
  const [input, setInput] = useState("");
  const [trace, setTrace] = useState<TraceEvent[]>([]);
  const [result, setResult] = useState<FitResult | null>(null);
  const [running, setRunning] = useState(false);
  const ranOnce = useRef(false);

  async function run(text: string) {
    setRunning(true);
    setResult(null);
    setTrace([]);
    const gen = runFitAssessment(text);
    const order: string[] = [];
    const byNode = new Map<string, TraceEvent>();
    let next = await gen.next();
    while (!next.done) {
      const ev = next.value;
      if (!byNode.has(ev.node)) order.push(ev.node);
      byNode.set(ev.node, ev);
      setTrace(order.map((n) => byNode.get(n)!));
      next = await gen.next();
    }
    setResult(next.value);
    setRunning(false);
  }

  // Auto-play once on mount (deferred so it doesn't setState during the effect).
  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    const t = setTimeout(() => run("Forward-deployed / AI engineer (example)"), 400);
    return () => clearTimeout(t);
  }, []);

  const status = running ? "running" : result ? "done" : "ready";

  return (
    <div className="rounded-[10px] border border-rule bg-surface p-5 font-mono text-sm">
      {/* status line */}
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <span className="flex items-center gap-2 text-xs">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${running ? "bg-attention accent-pulse" : "bg-ok"}`}
            aria-hidden
          />
          <ScrambleText text={`● ${status}`} className="uppercase tracking-[0.14em] text-faint" />
        </span>
        <span className="text-[0.65rem] uppercase tracking-[0.14em] text-faint">
          fit-assessment agent
        </span>
      </div>

      {/* input */}
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!running) run(input || "Software / AI engineer");
        }}
      >
        <label htmlFor="jd" className="sr-only">
          Paste a role or job description
        </label>
        <textarea
          id="jd"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          placeholder="paste a role or job description…"
          className="w-full resize-none rounded-md border border-rule bg-paper px-3 py-2 text-ink placeholder:text-faint focus:border-accent"
        />
        <button
          type="submit"
          disabled={running}
          className={`mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 ${running ? "cursor-wait opacity-60" : ""}`}
        >
          {running ? "Assessing…" : "Assess fit"}
        </button>
      </form>

      {/* trace */}
      {trace.length > 0 && (
        <ul className="mt-5 space-y-1.5 border-t border-rule pt-4 text-xs">
          {trace.map((ev) => (
            <li key={ev.node} className="flex gap-2">
              <span
                className={
                  ev.status === "done"
                    ? "text-ok"
                    : ev.status === "running"
                      ? "text-attention"
                      : "text-faint"
                }
                aria-hidden
              >
                {ev.status === "done" ? "✓" : ev.status === "running" ? "▷" : "–"}
              </span>
              <span className="text-muted">
                <span className="text-ink">{ev.label}</span>
                {ev.detail ? ` — ${ev.detail}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* result */}
      {result && (
        <div className="mt-5 border-t border-rule pt-4">
          <span className="inline-flex rounded-full bg-accent-soft px-2.5 py-0.5 text-[0.7rem] uppercase tracking-[0.12em] text-accent">
            {VERDICT_LABEL[result.verdict]}
          </span>
          <p className="mt-3 font-body text-[0.95rem] leading-relaxed text-ink">
            {result.paragraph}
          </p>
          {result.evidence.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {result.evidence.map((ev) => (
                <a
                  key={ev.label}
                  href={ev.href}
                  className="text-xs text-accent underline underline-offset-2"
                >
                  {ev.label}
                </a>
              ))}
            </div>
          )}
          <p className="mt-4 text-[0.65rem] uppercase tracking-[0.14em] text-faint">
            example output — not a live model yet
          </p>
        </div>
      )}
    </div>
  );
}

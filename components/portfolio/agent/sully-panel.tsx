"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { runFitAssessment } from "./run-fit-assessment";
import { AgentGraph } from "./agent-graph";
import type { FitResult, TraceEvent } from "./agent-types";

const AGENT = "Sully";
const VERDICT: Record<FitResult["verdict"], string> = {
  strong: "strong fit",
  plausible: "plausible fit",
  not_a_fit: "not a fit",
};

/** Full-width neon-dark agent: paste a role, watch Sully's flow, get the verdict. */
export function SullyPanel() {
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

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    const t = setTimeout(() => run("Forward-deployed / AI engineer (example)"), 500);
    return () => clearTimeout(t);
  }, []);

  const latest = trace[trace.length - 1];

  return (
    <div className="sully-stage rounded-2xl border p-5 font-body text-ink sm:p-7">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!running) run(input || "Software / AI engineer");
        }}
      >
        <label htmlFor="jd" className="sr-only">
          Paste a job description or a role you&rsquo;re hiring for
        </label>
        <input
          id="jd"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="paste a job description or a role you're hiring for…"
          className="flex-1 rounded-lg border border-rule bg-paper px-4 py-3 font-mono text-sm text-ink placeholder:text-faint focus:border-accent"
        />
        <button
          type="submit"
          disabled={running}
          className={`neon-btn shrink-0 rounded-lg bg-accent px-5 py-3 font-mono text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 ${running ? "cursor-wait opacity-60" : ""}`}
        >
          {running ? `${AGENT} is reading…` : `Ask ${AGENT}`}
        </button>
      </form>

      {/* the live flow graph — horizontal on desktop, vertical on phones */}
      <div className="mt-7">
        <div className="hidden sm:block">
          <AgentGraph trace={trace} result={result} orientation="h" />
        </div>
        <div className="mx-auto block max-w-[14rem] sm:hidden">
          <AgentGraph trace={trace} result={result} orientation="v" />
        </div>
      </div>

      <div className="mt-1 h-5 text-center font-mono text-[0.7rem] text-faint">
        {!result && latest && (
          <span>
            ▷ {latest.label}
            {latest.detail ? ` — ${latest.detail}` : ""}
          </span>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mt-4 border-t border-rule pt-5"
          >
            <span className="inline-flex rounded-full bg-accent-soft px-3 py-0.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-accent">
              {VERDICT[result.verdict]}
            </span>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-ink">
              {result.paragraph}
            </p>
            {result.evidence.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {result.evidence.map((ev) => (
                  <a
                    key={ev.label}
                    href={ev.href}
                    className="font-mono text-xs text-accent underline underline-offset-2"
                  >
                    {ev.label}
                  </a>
                ))}
              </div>
            )}
            <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-faint">
              example output — {AGENT} isn&rsquo;t wired to a live model yet
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

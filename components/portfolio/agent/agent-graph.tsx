"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { FitResult, TraceEvent } from "./agent-types";

type Status = "idle" | "running" | "done";

const NODES: { id: string; label: string; x: number; y: number }[] = [
  { id: "intake", label: "intake", x: 12, y: 32 },
  { id: "fit", label: "fit gate", x: 33, y: 32 },
  { id: "plan", label: "plan", x: 54, y: 32 },
  { id: "work", label: "work", x: 80, y: 13 },
  { id: "projects", label: "projects", x: 80, y: 32 },
  { id: "corpus", label: "corpus", x: 80, y: 51 },
  { id: "synth", label: "synthesize", x: 104, y: 32 },
  { id: "verdict", label: "verdict", x: 124, y: 32 },
];
const EDGES: [string, string][] = [
  ["intake", "fit"],
  ["fit", "plan"],
  ["plan", "work"],
  ["plan", "projects"],
  ["plan", "corpus"],
  ["work", "synth"],
  ["projects", "synth"],
  ["corpus", "synth"],
  ["synth", "verdict"],
];
// graph node → underlying trace node id(s)
const MAP: Record<string, string[]> = {
  intake: ["intake"],
  fit: ["fit_gate"],
  plan: ["plan"],
  work: ["gather_work"],
  projects: ["gather_projects"],
  corpus: ["gather_web"],
  synth: ["synthesize", "critique", "compose"],
};
const at = (id: string) => NODES.find((n) => n.id === id)!;

export function AgentGraph({
  trace,
  result,
}: {
  trace: TraceEvent[];
  result: FitResult | null;
}) {
  const reduce = useReducedMotion();
  const ts: Record<string, Status> = {};
  for (const e of trace) ts[e.node] = e.status === "skipped" ? "done" : e.status;

  function statusOf(id: string): Status {
    if (id === "verdict") {
      if (result) return "done";
      return ts["compose"] ? "running" : "idle";
    }
    const sts = (MAP[id] ?? []).map((n) => ts[n]).filter(Boolean) as Status[];
    if (sts.includes("running")) return "running";
    if (sts.length && sts.every((s) => s === "done")) return "done";
    if (sts.some((s) => s === "done")) return "running";
    return "idle";
  }

  const color = (s: Status) =>
    s === "done" ? "var(--accent)" : s === "running" ? "var(--accent)" : "var(--rule)";

  return (
    <svg
      viewBox="0 0 136 64"
      className="w-full"
      role="img"
      aria-label="Live agent flow: intake, fit gate, plan, gather work/projects/corpus, synthesize, verdict"
    >
      {/* edges */}
      {EDGES.map(([from, to], i) => {
        const a = at(from);
        const b = at(to);
        const lit = statusOf(from) === "done";
        return (
          <motion.path
            key={i}
            d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
            fill="none"
            stroke={lit ? "var(--accent)" : "var(--rule)"}
            strokeWidth={0.6}
            initial={false}
            animate={{ pathLength: lit ? 1 : 0.001, opacity: lit ? 0.9 : 0.4 }}
            transition={{ duration: reduce ? 0 : 0.5, ease: "easeOut" }}
          />
        );
      })}

      {/* nodes */}
      {NODES.map((n) => {
        const s = statusOf(n.id);
        const active = s !== "idle";
        return (
          <g key={n.id}>
            {/* glow ring while running */}
            {s === "running" && !reduce && (
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={4}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={0.5}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                style={{ transformOrigin: `${n.x}px ${n.y}px` }}
              />
            )}
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={3.4}
              initial={false}
              animate={{
                fill: s === "done" ? "var(--accent)" : "var(--surface)",
                scale: s === "running" && !reduce ? [1, 1.14, 1] : 1,
              }}
              transition={{
                fill: { duration: 0.3 },
                scale: { duration: 1.1, repeat: s === "running" && !reduce ? Infinity : 0 },
              }}
              stroke={color(s)}
              strokeWidth={0.8}
              style={{ transformOrigin: `${n.x}px ${n.y}px` }}
            />
            <text
              x={n.x}
              y={n.y + 8}
              textAnchor="middle"
              style={{ fontSize: 3, fontFamily: "var(--font-mono), monospace" }}
              fill={active ? "var(--ink)" : "var(--faint)"}
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

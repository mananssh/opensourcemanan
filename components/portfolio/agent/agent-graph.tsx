"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { FitResult, TraceEvent } from "./agent-types";

type Status = "idle" | "running" | "done";
type Orientation = "h" | "v";

const LABELS: Record<string, string> = {
  intake: "intake",
  fit: "fit gate",
  plan: "plan",
  work: "work",
  projects: "projects",
  corpus: "corpus",
  synth: "synthesize",
  verdict: "verdict",
};
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
const MAP: Record<string, string[]> = {
  intake: ["intake"],
  fit: ["fit_gate"],
  plan: ["plan"],
  work: ["gather_work"],
  projects: ["gather_projects"],
  corpus: ["gather_web"],
  synth: ["synthesize", "critique", "compose"],
};

const LAYOUT: Record<
  Orientation,
  { viewBox: string; pos: Record<string, [number, number]>; labelDx: number; labelDy: number; anchor: "middle" | "start" }
> = {
  h: {
    viewBox: "0 0 138 64",
    pos: {
      intake: [12, 32],
      fit: [33, 32],
      plan: [54, 32],
      work: [80, 13],
      projects: [80, 32],
      corpus: [80, 51],
      synth: [106, 32],
      verdict: [126, 32],
    },
    labelDx: 0,
    labelDy: 7,
    anchor: "middle",
  },
  v: {
    viewBox: "0 0 64 196",
    pos: {
      intake: [32, 14],
      fit: [32, 40],
      plan: [32, 66],
      work: [14, 100],
      projects: [32, 100],
      corpus: [50, 100],
      synth: [32, 138],
      verdict: [32, 168],
    },
    labelDx: 0,
    labelDy: 6.5,
    anchor: "middle",
  },
};

export function AgentGraph({
  trace,
  result,
  orientation = "h",
}: {
  trace: TraceEvent[];
  result: FitResult | null;
  orientation?: Orientation;
}) {
  const reduce = useReducedMotion();
  const layout = LAYOUT[orientation];
  const at = (id: string) => layout.pos[id];

  const ts: Record<string, Status> = {};
  for (const e of trace) ts[e.node] = e.status === "skipped" ? "done" : e.status;

  function statusOf(id: string): Status {
    if (id === "verdict") return result ? "done" : ts["compose"] ? "running" : "idle";
    const sts = (MAP[id] ?? []).map((n) => ts[n]).filter(Boolean) as Status[];
    if (sts.includes("running")) return "running";
    if (sts.length && sts.every((s) => s === "done")) return "done";
    if (sts.some((s) => s === "done")) return "running";
    return "idle";
  }

  return (
    <svg
      viewBox={layout.viewBox}
      className="w-full"
      role="img"
      aria-label="Live agent flow: intake, fit gate, plan, gather work/projects/corpus, synthesize, verdict"
    >
      {EDGES.map(([from, to], i) => {
        const [ax, ay] = at(from);
        const [bx, by] = at(to);
        const lit = statusOf(from) === "done";
        return (
          <motion.path
            key={i}
            d={`M ${ax} ${ay} L ${bx} ${by}`}
            fill="none"
            stroke={lit ? "var(--accent)" : "var(--rule)"}
            strokeWidth={0.5}
            initial={false}
            animate={{ pathLength: lit ? 1 : 0.001, opacity: lit ? 0.95 : 0.45 }}
            transition={{ duration: reduce ? 0 : 0.5, ease: "easeOut" }}
          />
        );
      })}

      {Object.keys(LABELS).map((id) => {
        const [x, y] = at(id);
        const s = statusOf(id);
        const active = s !== "idle";
        return (
          <g key={id}>
            {s === "running" && !reduce && (
              <motion.circle
                cx={x}
                cy={y}
                r={2.8}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={0.4}
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: [1, 2], opacity: [0.7, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
            )}
            <motion.circle
              cx={x}
              cy={y}
              r={2.4}
              initial={false}
              animate={{
                fill: s === "done" ? "var(--accent)" : "var(--surface)",
                scale: s === "running" && !reduce ? [1, 1.18, 1] : 1,
              }}
              transition={{
                fill: { duration: 0.3 },
                scale: { duration: 1.1, repeat: s === "running" && !reduce ? Infinity : 0 },
              }}
              stroke="var(--accent)"
              strokeWidth={active ? 0.8 : 0.5}
              strokeOpacity={active ? 1 : 0.45}
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
            <text
              x={x + layout.labelDx}
              y={y + 2.4 + layout.labelDy}
              textAnchor={layout.anchor}
              style={{ fontSize: 2.6, fontFamily: "var(--font-mono), monospace" }}
              fill={active ? "var(--ink)" : "var(--faint)"}
            >
              {LABELS[id]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

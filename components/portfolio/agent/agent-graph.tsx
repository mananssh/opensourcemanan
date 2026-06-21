"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { NodeId } from "./agent-types";

export type NodeStatus = "idle" | "running" | "done" | "skipped" | "error";
type Orientation = "h" | "v";

const LABELS: Record<NodeId, string> = {
  intake: "intake",
  fit_gate: "fit gate",
  plan: "plan",
  work_history: "work",
  projects: "projects",
  web_corpus: "web corpus",
  synthesize: "synthesize",
  critique: "critique",
  compose: "compose",
};

type Edge = { from: NodeId; to: NodeId; kind?: "decline" | "loop" };
const EDGES: Edge[] = [
  { from: "intake", to: "fit_gate" },
  { from: "fit_gate", to: "plan" },
  { from: "plan", to: "work_history" },
  { from: "plan", to: "projects" },
  { from: "plan", to: "web_corpus" },
  { from: "work_history", to: "synthesize" },
  { from: "projects", to: "synthesize" },
  { from: "web_corpus", to: "synthesize" },
  { from: "synthesize", to: "critique" },
  { from: "critique", to: "compose" },
  { from: "fit_gate", to: "compose", kind: "decline" },
  { from: "critique", to: "plan", kind: "loop" },
];

const LAYOUT: Record<
  Orientation,
  { viewBox: string; pos: Record<NodeId, [number, number]>; font: number; labelDy: number }
> = {
  h: {
    viewBox: "0 0 224 86",
    pos: {
      intake: [16, 44],
      fit_gate: [46, 44],
      plan: [78, 44],
      work_history: [118, 18],
      projects: [118, 44],
      web_corpus: [118, 70],
      synthesize: [156, 44],
      critique: [186, 44],
      compose: [212, 44],
    },
    font: 3.1,
    labelDy: 7.5,
  },
  v: {
    viewBox: "0 0 72 240",
    pos: {
      intake: [36, 16],
      fit_gate: [36, 44],
      plan: [36, 72],
      work_history: [16, 110],
      projects: [36, 110],
      web_corpus: [56, 110],
      synthesize: [36, 150],
      critique: [36, 184],
      compose: [36, 214],
    },
    font: 3.4,
    labelDy: 7,
  },
};

function strokeFor(s: NodeStatus): string {
  if (s === "done") return "var(--accent)";
  if (s === "running") return "var(--accent)";
  if (s === "error") return "var(--negative)";
  if (s === "skipped") return "var(--faint)";
  return "var(--rule)";
}

export function AgentGraph({
  nodes,
  pass = 0,
  orientation = "h",
}: {
  nodes: Record<NodeId, NodeStatus>;
  pass?: number;
  orientation?: Orientation;
}) {
  const reduce = useReducedMotion();
  const layout = LAYOUT[orientation];
  const at = (id: NodeId) => layout.pos[id];

  return (
    <svg
      viewBox={layout.viewBox}
      className="w-full"
      role="img"
      aria-label="Live agent flow: intake, fit gate, plan, the parallel gather band, synthesize, critique loop, compose"
    >
      {EDGES.map((e, i) => {
        const [ax, ay] = at(e.from);
        const [bx, by] = at(e.to);
        const lit =
          e.kind === "loop"
            ? pass > 0
            : e.kind === "decline"
              ? nodes.fit_gate === "done" && nodes.plan === "skipped"
              : nodes[e.from] === "done";
        const dashed = e.kind === "loop" || e.kind === "decline";
        // Curve the special off-diagram edges so they read as detours.
        const d =
          e.kind === "loop"
            ? `M ${ax} ${ay} C ${ax} ${ay + 22}, ${bx} ${by + 22}, ${bx} ${by}`
            : e.kind === "decline"
              ? `M ${ax} ${ay} C ${ax + 20} ${ay - 30}, ${bx - 20} ${by - 30}, ${bx} ${by}`
              : `M ${ax} ${ay} L ${bx} ${by}`;
        return (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke={lit ? "var(--accent)" : "var(--rule)"}
            strokeWidth={0.5}
            strokeDasharray={dashed ? "1.6 1.6" : undefined}
            initial={false}
            animate={{ opacity: lit ? 0.9 : dashed ? 0.18 : 0.4 }}
            transition={{ duration: reduce ? 0 : 0.4 }}
          />
        );
      })}

      {(Object.keys(LABELS) as NodeId[]).map((id) => {
        const [x, y] = at(id);
        const s = nodes[id] ?? "idle";
        const active = s !== "idle";
        const below = orientation === "h" && (id === "work_history" || id === "projects" || id === "web_corpus");
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
                animate={{ scale: [1, 2.1], opacity: [0.7, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
            )}
            <motion.circle
              cx={x}
              cy={y}
              r={2.4}
              initial={false}
              animate={{ fill: s === "done" ? "var(--accent)" : "var(--surface)" }}
              transition={{ duration: 0.3 }}
              stroke={strokeFor(s)}
              strokeWidth={active ? 0.8 : 0.5}
              strokeOpacity={s === "skipped" ? 0.5 : active ? 1 : 0.5}
              strokeDasharray={s === "skipped" ? "0.8 0.8" : undefined}
            />
            <text
              x={x}
              y={below ? y + 2.4 + layout.labelDy : y - 3.4}
              textAnchor="middle"
              style={{ fontSize: layout.font, fontFamily: "var(--font-mono), monospace" }}
              fill={active ? (s === "skipped" ? "var(--faint)" : "var(--ink)") : "var(--faint)"}
              opacity={s === "skipped" ? 0.6 : 1}
            >
              {LABELS[id]}
            </text>
          </g>
        );
      })}

      {pass > 0 && (
        <text
          x={orientation === "h" ? 132 : 36}
          y={orientation === "h" ? 84 : 134}
          textAnchor="middle"
          style={{ fontSize: layout.font, fontFamily: "var(--font-mono), monospace" }}
          fill="var(--accent)"
        >
          pass {pass}
        </text>
      )}
    </svg>
  );
}

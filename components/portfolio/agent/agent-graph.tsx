"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { NodeId } from "./agent-types";

export type NodeStatus = "idle" | "running" | "done" | "skipped" | "error";
type Orientation = "h" | "v";

/** Compact labels that fit inside the rounded-rect nodes. */
const DISPLAY: Record<NodeId, string> = {
  intake: "intake",
  fit_gate: "gate",
  plan: "plan",
  work_history: "work",
  projects: "projects",
  web_corpus: "corpus",
  synthesize: "synth",
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

const HW = 14; // node half-width
const HH = 4.6; // node half-height

const LAYOUT: Record<
  Orientation,
  { viewBox: string; pos: Record<NodeId, [number, number]>; font: number; passAt: [number, number] }
> = {
  h: {
    viewBox: "0 0 278 104",
    pos: {
      intake: [24, 50],
      fit_gate: [60, 50],
      plan: [96, 50],
      work_history: [140, 26],
      projects: [140, 50],
      web_corpus: [140, 74],
      synthesize: [186, 50],
      critique: [220, 50],
      compose: [254, 50],
    },
    font: 3.2,
    passAt: [140, 98],
  },
  v: {
    viewBox: "0 0 132 268",
    pos: {
      intake: [66, 22],
      fit_gate: [66, 56],
      plan: [66, 90],
      work_history: [30, 132],
      projects: [66, 132],
      web_corpus: [102, 132],
      synthesize: [66, 176],
      critique: [66, 210],
      compose: [66, 244],
    },
    font: 3.4,
    passAt: [108, 132],
  },
};

function edgePath(o: Orientation, e: Edge, a: [number, number], b: [number, number]): string {
  const [ax, ay] = a;
  const [bx, by] = b;
  if (e.kind === "loop") {
    // Arc back from critique to plan, bowing out past the flow.
    return o === "h"
      ? `M ${ax} ${ay + HH} C ${ax} ${ay + 34}, ${bx} ${by + 34}, ${bx} ${by + HH}`
      : `M ${ax + HW} ${ay} C ${ax + 52} ${ay}, ${bx + 52} ${by}, ${bx + HW} ${by}`;
  }
  if (e.kind === "decline") {
    return o === "h"
      ? `M ${ax} ${ay - HH} C ${ax + 30} ${ay - 38}, ${bx - 30} ${by - 38}, ${bx} ${by - HH}`
      : `M ${ax - HW} ${ay} C ${ax - 54} ${ay}, ${bx - 54} ${by}, ${bx - HW} ${by}`;
  }
  if (o === "h") {
    return `M ${ax + HW} ${ay} C ${ax + HW + 9} ${ay}, ${bx - HW - 9} ${by}, ${bx - HW} ${by}`;
  }
  return `M ${ax} ${ay + HH} C ${ax} ${ay + HH + 7}, ${bx} ${by - HH - 7}, ${bx} ${by - HH}`;
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

  function edgeLit(e: Edge): boolean {
    if (e.kind === "loop") return pass > 0;
    if (e.kind === "decline") return nodes.fit_gate === "done" && nodes.plan === "skipped";
    if (e.from === "fit_gate" && e.to === "plan") return nodes.fit_gate === "done" && nodes.plan !== "skipped";
    if (e.from === "critique" && e.to === "compose") return nodes.compose !== "idle" && nodes.compose !== "skipped";
    return nodes[e.from] === "done";
  }

  return (
    <svg
      viewBox={layout.viewBox}
      className="w-full overflow-visible"
      role="img"
      aria-label="Live agent flow: intake, fit gate, plan, the parallel gather band (work/projects/corpus), synthesize, critique with a re-gather loop, and compose."
    >
      <defs>
        <marker id="ar-on" markerWidth="5" markerHeight="5" refX="4.2" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0.5,0.7 L4.3,2.5 L0.5,4.3 Z" fill="var(--accent)" />
        </marker>
        <marker id="ar-off" markerWidth="5" markerHeight="5" refX="4.2" refY="2.5" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0.5,0.7 L4.3,2.5 L0.5,4.3 Z" fill="var(--rule)" />
        </marker>
      </defs>

      {/* edges — faint baseline always; accent overlay draws on when taken */}
      {EDGES.map((e, i) => {
        const d = edgePath(orientation, e, at(e.from), at(e.to));
        const lit = edgeLit(e);
        const special = e.kind === "loop" || e.kind === "decline";
        return (
          <g key={`e${i}`}>
            <path
              d={d}
              fill="none"
              stroke="var(--rule)"
              strokeWidth={0.5}
              strokeDasharray={special ? "1.6 1.6" : undefined}
              opacity={special ? 0.16 : 0.38}
              markerEnd={lit ? undefined : "url(#ar-off)"}
            />
            {lit && (
              <motion.path
                d={d}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={0.6}
                strokeDasharray={special ? "1.6 1.6" : undefined}
                markerEnd="url(#ar-on)"
                initial={reduce ? { pathLength: 1, opacity: 0.95 } : { pathLength: 0, opacity: 1 }}
                animate={{ pathLength: 1, opacity: 0.95 }}
                transition={{ duration: reduce ? 0 : 0.5, ease: "easeOut" }}
              />
            )}
          </g>
        );
      })}

      {/* nodes */}
      {(Object.keys(DISPLAY) as NodeId[]).map((id) => {
        const [cx, cy] = at(id);
        const s = nodes[id] ?? "idle";
        const x = cx - HW;
        const y = cy - HH;
        const border =
          s === "running" || s === "done"
            ? s === "done"
              ? "var(--rule)" // done settles to a calm hairline + check
              : "var(--accent)"
            : s === "error"
              ? "var(--negative)"
              : s === "skipped"
                ? "var(--faint)"
                : "var(--rule)";
        const labelColor =
          s === "skipped" ? "var(--faint)" : s === "idle" ? "var(--faint)" : "var(--ink)";
        return (
          <g key={id} opacity={s === "skipped" ? 0.55 : 1}>
            {s === "running" && !reduce && (
              <motion.rect
                x={x - 1.4}
                y={y - 1.4}
                width={HW * 2 + 2.8}
                height={HH * 2 + 2.8}
                rx={3.4}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={0.5}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.05, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <rect
              x={x}
              y={y}
              width={HW * 2}
              height={HH * 2}
              rx={2.6}
              fill="var(--surface)"
              stroke={border}
              strokeWidth={s === "running" ? 0.8 : 0.5}
              strokeDasharray={s === "skipped" ? "1 1" : undefined}
            />
            {/* running dot */}
            {s === "running" && (
              <circle cx={x + 3} cy={cy} r={0.9} fill="var(--accent)" />
            )}
            {/* done check */}
            {s === "done" && (
              <path
                d={`M ${cx + HW - 5.4} ${cy} l 1.3 1.4 l 2.8 -3.1`}
                fill="none"
                stroke="var(--ok)"
                strokeWidth={0.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* error glyph */}
            {s === "error" && (
              <text x={cx + HW - 3.4} y={cy + 1.1} textAnchor="middle" style={{ fontSize: 3.4, fontWeight: 700 }} fill="var(--negative)">
                !
              </text>
            )}
            <text
              x={cx - (s === "running" ? 1.4 : 0)}
              y={cy + 1.15}
              textAnchor="middle"
              style={{ fontSize: layout.font, fontFamily: "var(--font-mono), monospace", letterSpacing: "-0.04em" }}
              fill={labelColor}
            >
              {DISPLAY[id]}
            </text>
          </g>
        );
      })}

      {pass > 0 && (
        <motion.text
          x={layout.passAt[0]}
          y={layout.passAt[1]}
          textAnchor="middle"
          style={{ fontSize: layout.font + 0.2, fontFamily: "var(--font-mono), monospace" }}
          fill="var(--accent)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ↻ pass {pass}
        </motion.text>
      )}
    </svg>
  );
}

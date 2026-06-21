"use client";

import { useEffect, useRef, useState } from "react";
import type { NodeStatus } from "./agent-graph";
import { NODE_LABELS, type NodeId } from "./agent-types";

function dotColor(s: NodeStatus): string {
  if (s === "done") return "var(--ok)";
  if (s === "error") return "var(--negative)";
  if (s === "skipped") return "var(--faint)";
  return "var(--accent)";
}

export interface ThinkingProps {
  order: NodeId[];
  nodes: Record<NodeId, NodeStatus>;
  reasoning: Record<NodeId, string>;
  detail: Partial<Record<NodeId, string>>;
  summary: Partial<Record<NodeId, string>>;
  active: NodeId | null;
  running: boolean;
}

/**
 * The live reasoning panel. The running node shows its streamed thinking in full;
 * completed nodes collapse to a one-line summary you can re-expand. Auto-scrolls
 * to the active node, but yields if the reader scrolls up. ARIA-live (polite).
 */
export function ThinkingStream({ order, nodes, reasoning, detail, summary, active, running }: ThinkingProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [expanded, setExpanded] = useState<Set<NodeId>>(new Set());

  // Track whether the reader is at the bottom (so we don't fight their scroll).
  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  }

  const activeText = active ? reasoning[active] ?? "" : "";
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [activeText, order.length, active]);

  function toggle(n: NodeId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      aria-live="polite"
      aria-busy={running}
      aria-label="Sully's live reasoning"
      className="max-h-[19rem] space-y-3 overflow-y-auto pr-1 sm:max-h-[24rem]"
    >
      {order.map((n) => {
        const s = nodes[n] ?? "idle";
        const isActive = active === n;
        const open = isActive || expanded.has(n);
        const text = reasoning[n] ?? "";
        const canToggle = !isActive && (text.length > 0 || s === "done");
        return (
          <div key={n} className="border-l border-rule pl-3">
            <button
              type="button"
              onClick={() => canToggle && toggle(n)}
              disabled={!canToggle}
              className={`flex w-full items-center gap-2 text-left font-mono text-xs ${canToggle ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${s === "running" ? "animate-pulse motion-reduce:animate-none" : ""}`}
                style={{ background: dotColor(s) }}
              />
              <span className="text-ink">{NODE_LABELS[n]}</span>
              {detail[n] && <span className="truncate text-faint">· {detail[n]}</span>}
              {!open && summary[n] && <span className="truncate text-faint">· {summary[n]}</span>}
              {s === "skipped" && <span className="text-faint">· skipped</span>}
              {canToggle && (
                <span className="ml-auto text-faint">{open ? "−" : "+"}</span>
              )}
            </button>
            {open && text && (
              <p className="mt-1.5 whitespace-pre-wrap font-body text-[0.85rem] leading-relaxed text-muted">
                {text}
                {isActive && running && (
                  <span className="ml-0.5 inline-block animate-pulse text-accent motion-reduce:animate-none">▌</span>
                )}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

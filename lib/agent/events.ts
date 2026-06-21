import "server-only";
import type { AgentEvent } from "@/components/portfolio/agent/agent-types";

/**
 * A run-scoped event bus. The agent NEVER scrapes LangGraph's internal stream —
 * each node explicitly `emit()`s what it actually did, and the route drains the
 * bus into the NDJSON response. This keeps us in total control of what's shown
 * (honesty by construction) and decoupled from LangGraph's streaming API.
 *
 * `drain()` is an async generator the route iterates; `emit()` pushes events
 * from inside nodes (threaded via the graph's `configurable`); `close()` ends it.
 */
export type Emit = (ev: AgentEvent) => void;

export interface EventStream {
  emit: Emit;
  close: () => void;
  drain: () => AsyncGenerator<AgentEvent, void, void>;
}

export function createEventStream(): EventStream {
  const queue: AgentEvent[] = [];
  let wake: (() => void) | null = null;
  let closed = false;

  const emit: Emit = (ev) => {
    if (closed) return;
    queue.push(ev);
    wake?.();
    wake = null;
  };

  const close = () => {
    closed = true;
    wake?.();
    wake = null;
  };

  async function* drain(): AsyncGenerator<AgentEvent, void, void> {
    for (;;) {
      if (queue.length) {
        yield queue.shift()!;
        continue;
      }
      if (closed) return;
      await new Promise<void>((resolve) => {
        wake = resolve;
      });
    }
  }

  return { emit, close, drain };
}

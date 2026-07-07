/**
 * The Ask Sully contract. This module is imported by the client (the overlay
 * UI) AND by server code (`lib/agent/ask/*`) — it must stay free of any
 * server/node code, mirroring `components/portfolio/agent/agent-types.ts`.
 *
 * Ask Sully is a lightweight, general "ask about Manan" chat — one scoped
 * streaming completion per turn, not a graph. Kept deliberately simpler than
 * the fit-agent's `AgentEvent` union: there's no structured verdict to
 * assemble, just streamed prose.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** A bounded snapshot of what's currently on screen, for "explain what's on the screen". */
export interface PageContext {
  title: string;
  path: string;
  text: string;
}

export type AskEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

/** Shown as one-tap chips in the panel's empty state. */
export const EXAMPLE_PROMPTS: string[] = [
  "What has Manan built recently?",
  "Is he a fit for backend roles?",
  "Explain what's on this screen",
  "What is Sully?",
];

/** Thrown by runAskSully when the public daily cap is hit. */
export class AskRestingError extends Error {
  constructor(message = "Sully is resting") {
    super(message);
    this.name = "AskRestingError";
  }
}

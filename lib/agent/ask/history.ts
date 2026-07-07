import "server-only";
import type { ChatMessage } from "@/components/portfolio/ask-sully/ask-types";

/**
 * Server-side, defense-in-depth truncation of the client-supplied transcript.
 * Never trust client-side history length/content — a fabricated request could
 * replay an oversized history even though each turn was capped when live.
 * Bounds how much a long conversation's token cost can grow per turn.
 */
export function truncateHistory(
  messages: ChatMessage[],
  { maxTurns = 8, maxCharsPerMessage = 1000 }: { maxTurns?: number; maxCharsPerMessage?: number } = {},
): ChatMessage[] {
  return messages
    .slice(-maxTurns)
    .map((m) => ({ role: m.role, content: m.content.slice(0, maxCharsPerMessage) }));
}

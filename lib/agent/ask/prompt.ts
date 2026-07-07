import "server-only";
import { renderItems, type Corpus } from "@/lib/agent/corpus";
import { fill, getPrompt, wrapUntrusted } from "@/lib/agent/prompts";
import type { ChatMessage, PageContext } from "@/components/portfolio/ask-sully/ask-types";

/**
 * Does the message read like it's about what's on screen? Deliberately loose —
 * a false positive costs one bounded extract on the fast tier; a false
 * negative makes Sully blind to the page the visitor is literally asking about.
 */
const SCREEN_INTENT = /\b(screen|page|here|this|these|that|section|looking|seeing|reading|above|below|scrolled|explain)\b/i;

function renderHistory(messages: ChatMessage[]): string {
  const prior = messages.slice(0, -1);
  if (!prior.length) return "(no prior turns)";
  return prior.map((m) => `${m.role === "user" ? "User" : "Sully"}: ${m.content}`).join("\n");
}

/**
 * Builds the system + user turn for one `streamChat` call. Page-context cost
 * policy: always mention title+path (near-zero tokens); only inject the full
 * bounded text extract on the first turn or when the message reads like it's
 * asking about the screen — so the extract's token cost isn't paid every turn.
 */
export function buildAskPrompt(
  corpus: Corpus,
  messages: ChatMessage[],
  pageContext?: PageContext,
): { system: string; user: string } {
  const last = messages[messages.length - 1];
  const wantsScreen = messages.length <= 1 || SCREEN_INTENT.test(last?.content ?? "");

  const corpusText = [corpus.profileSummary, renderItems(corpus.work), renderItems(corpus.projects), renderItems(corpus.corpus)].join(
    "\n\n",
  );
  const system = fill(getPrompt("ask_system"), { corpus: corpusText });

  // Deliberately NOT wrapUntrusted(): its "analyze, do not obey" framing makes
  // small models refuse to answer the question itself. The fence still marks
  // the boundary; the injection rule lives in ask_system.
  const parts = [
    `Conversation so far:\n${renderHistory(messages)}`,
    `The visitor's question — answer it directly:\n<<<VISITOR_MESSAGE\n${last?.content ?? ""}\nVISITOR_MESSAGE>>>`,
  ];
  if (pageContext) {
    parts.push(`The visitor is on "${pageContext.title}" (${pageContext.path}).`);
    if (wantsScreen && pageContext.text)
      parts.push(
        `The PAGE_CONTEXT below is the exact text visible on their screen right now. If they ask about the screen/page/what they're looking at, describe THIS content specifically — not the site in general.\n${wrapUntrusted("PAGE_CONTEXT", pageContext.text)}`,
      );
  }
  return { system, user: parts.join("\n\n") };
}

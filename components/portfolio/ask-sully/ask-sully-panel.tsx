"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { portfolioScope } from "@/lib/portfolio/fonts";
import { SullyAvatar } from "@/components/portfolio/agent/sully-avatar";
import { runAskSully } from "./run-ask-sully";
import { capturePageContext } from "./page-context";
import { AskRestingError, EXAMPLE_PROMPTS, type ChatMessage } from "./ask-types";
import { useAskSully } from "./ask-sully-provider";

interface DisplayMessage extends ChatMessage {
  id: number;
}

/**
 * The chat overlay. A Radix Dialog bottom sheet (capped well under full
 * viewport height) so a blurred strip of the live page stays visible above it
 * — the "site should still be visible, blurred" requirement, and a direct
 * echo of the Gemini-on-Android overlay this was modeled on. Slide-up/down is
 * driven by the `ask-sheet`/`ask-overlay` keyframes in globals.css.
 */
export function AskSullyPanel() {
  const { open, close, prefill } = useAskSully();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefill) {
      // Re-apply on every openWithPrefill(text) call, including an identical quote twice.
      /* eslint-disable react-hooks/set-state-in-effect */
      setInput(prefill.text);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.nonce]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // RAF-throttled streaming flush — same pattern as sully-panel.tsx, applied to a flat message list.
  const pending = useRef("");
  const raf = useRef<number | null>(null);
  const streamingId = useRef<number | null>(null);
  function flush() {
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
    if (pending.current && streamingId.current != null) {
      const delta = pending.current;
      pending.current = "";
      const id = streamingId.current;
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: m.content + delta } : m)));
    }
  }
  function schedule() {
    if (raf.current == null) raf.current = requestAnimationFrame(flush);
  }
  useEffect(
    () => () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    },
    [],
  );

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    setInput("");
    const userMsg: DisplayMessage = { id: idRef.current++, role: "user", content };
    const assistantId = idRef.current++;
    const assistantMsg: DisplayMessage = { id: assistantId, role: "assistant", content: "" };
    const history: ChatMessage[] = [...messages, userMsg].map(({ role, content: c }) => ({ role, content: c }));
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setBusy(true);
    streamingId.current = assistantId;
    pending.current = "";
    try {
      const pageContext = capturePageContext();
      const gen = runAskSully(history, pageContext);
      let next = await gen.next();
      while (!next.done) {
        if (next.value.type === "delta") {
          pending.current += next.value.text;
          schedule();
        }
        next = await gen.next();
      }
      flush();
    } catch (err) {
      flush();
      if (err instanceof AskRestingError) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        setError("Sully is resting right now — try again in a bit.");
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content || "Sully hit a snag — try again." } : m)),
        );
      }
    } finally {
      setBusy(false);
      streamingId.current = null;
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="ask-overlay fixed inset-0 z-60 bg-black/45 backdrop-blur-md" />
        <Dialog.Content
          className={`${portfolioScope} ask-sheet fixed inset-x-0 bottom-0 z-61 mx-auto flex w-[95vw] max-h-[85vh] flex-col rounded-t-3xl border-t border-accent/30 bg-paper/95 text-ink shadow-2xl backdrop-blur-xl focus:outline-none sm:bottom-6 sm:w-[min(75vw,880px)] sm:max-h-[70vh] sm:rounded-3xl sm:border`}
        >
          {/* Drag-handle affordance — pure visual, the sheet closes via ×/Esc/overlay. */}
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-rule" />
          <div className="flex items-center justify-between px-5 pb-3 pt-2">
            <Dialog.Title className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-accent">
              <SullyAvatar className="h-4 w-4" colorClass="bg-accent" />
              Ask Sully
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-accent"
            >
              ×
            </Dialog.Close>
          </div>

          <div ref={listRef} className="custom-scrollbar flex-1 overflow-y-auto border-t border-rule px-5 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-4">
                <p className="font-body text-sm text-muted">
                  Ask anything about Manan — his work, background, or what&rsquo;s on this page.
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => send(p)}
                      className="rounded-full border border-rule bg-surface/60 px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((m) => {
                  const isStreaming = busy && m.role === "assistant" && m.id === messages[messages.length - 1]?.id;
                  if (m.role === "user") {
                    return (
                      <div
                        key={m.id}
                        className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-accent/40 bg-accent-soft px-4 py-2 font-body text-sm leading-relaxed text-ink"
                      >
                        {m.content}
                      </div>
                    );
                  }
                  // Assistant turns render Gemini-style: a small mark + plain prose, no bubble.
                  return (
                    <div key={m.id} className="flex max-w-[92%] gap-3">
                      <SullyAvatar className="mt-1 h-5 w-5 shrink-0" colorClass="bg-accent" />
                      {isStreaming && !m.content ? (
                        <span aria-label="Sully is thinking" className="flex items-center gap-1 py-2">
                          <span className="ask-dot h-1.5 w-1.5 rounded-full bg-accent" />
                          <span className="ask-dot d2 h-1.5 w-1.5 rounded-full bg-accent" />
                          <span className="ask-dot d3 h-1.5 w-1.5 rounded-full bg-accent" />
                        </span>
                      ) : (
                        <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-ink">
                          {m.content}
                          {isStreaming && (
                            <span
                              aria-hidden
                              className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-accent align-middle"
                            />
                          )}
                        </p>
                      )}
                    </div>
                  );
                })}
                {error && <p className="font-mono text-xs text-negative">{error}</p>}
              </div>
            )}
          </div>

          <form
            className="flex items-center gap-2 border-t border-rule p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="ask-sully-input" className="sr-only">
              Ask Sully a question
            </label>
            <input
              id="ask-sully-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ask about Manan…"
              className="min-w-0 flex-1 rounded-full border border-rule bg-surface/60 px-4 py-2.5 font-body text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
              </svg>
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AskSullyButton } from "./ask-sully-button";
import { SelectionTooltip } from "./selection-tooltip";
import { AskSullyPanel } from "./ask-sully-panel";

interface Prefill {
  text: string;
  /** Increments per `openWithPrefill(text)` call so the panel can re-apply an identical quote twice. */
  nonce: number;
}

interface AskSullyContextValue {
  open: boolean;
  prefill: Prefill | null;
  /** Opens the panel; when `text` is given, it's set as the (overwritable) draft input. */
  openWithPrefill: (text?: string) => void;
  close: () => void;
}

const AskSullyContext = createContext<AskSullyContextValue | null>(null);

export function useAskSully(): AskSullyContextValue {
  const ctx = useContext(AskSullyContext);
  if (!ctx) throw new Error("useAskSully must be used within AskSullyProvider");
  return ctx;
}

/**
 * The single mount point for the whole Ask Sully overlay system: the floating
 * trigger, the text-selection popup, and the chat panel. Holds only
 * open/prefill state — chat message history lives inside the panel itself, so
 * closing the (Radix) dialog naturally discards it on unmount.
 */
export function AskSullyProvider() {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const nonceRef = useRef(0);

  const openWithPrefill = useCallback((text?: string) => {
    if (text !== undefined) {
      nonceRef.current += 1;
      setPrefill({ text, nonce: nonceRef.current });
    }
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <AskSullyContext.Provider value={{ open, prefill, openWithPrefill, close }}>
      <AskSullyButton />
      <SelectionTooltip />
      <AskSullyPanel />
    </AskSullyContext.Provider>
  );
}

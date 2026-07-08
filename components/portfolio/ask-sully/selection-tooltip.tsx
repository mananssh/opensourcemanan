"use client";

import { useEffect, useState } from "react";
import { useAskSully } from "./ask-sully-provider";

const MAX_QUOTE_CHARS = 200;

/**
 * Shows an "Ask Sully" popup near any text selected inside `#content`. Needs
 * raw `Range`-based positioning regardless of tooltip library — there's no
 * DOM element to anchor to, only a text selection.
 */
export function SelectionTooltip() {
  const { openWithPrefill } = useAskSully();
  const [pos, setPos] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    function onSelectionChange() {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? "";
      const content = document.getElementById("content");
      if (!text || !sel || sel.rangeCount === 0 || !content) {
        setPos(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!content.contains(range.commonAncestorContainer)) {
        setPos(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }
      setPos({ x: rect.left + rect.width / 2, y: rect.top, text });
    }
    function hide() {
      setPos(null);
    }
    document.addEventListener("selectionchange", onSelectionChange);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      window.removeEventListener("scroll", hide, true);
    };
  }, []);

  if (!pos) return null;

  return (
    <button
      type="button"
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-50 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-full border border-accent bg-accent-soft px-3 py-1.5 font-mono text-[0.7rem] text-accent shadow-lg transition-transform hover:scale-105"
      // Selecting text collapses on mousedown by default — stop that so the
      // click can still read the selection.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        const quote = pos.text.slice(0, MAX_QUOTE_CHARS);
        openWithPrefill(`Explain: "${quote}"`);
        setPos(null);
        window.getSelection()?.removeAllRanges();
      }}
    >
      Ask Sully →
    </button>
  );
}

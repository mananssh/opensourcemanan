"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SullyAvatar } from "@/components/portfolio/agent/sully-avatar";
import { useAskSully } from "./ask-sully-provider";

const SEEN_KEY = "sully:ask-opened";

/**
 * Fixed bottom-center trigger. Coral, matching the portfolio's own accent —
 * this overlay is a site-wide feature, not Sully's dedicated (green) section,
 * so its chrome inherits the normal theme rather than a separate identity. A
 * soft ambient glow (blurred, not a hard ring) invites interaction without
 * nagging — it quiets itself after the visitor opens the panel once this
 * session (a `sessionStorage` flag, not a permanent dismissal).
 */
export function AskSullyButton() {
  const { open, openWithPrefill } = useAskSully();
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SEEN_KEY)) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setPulse(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, []);

  if (open) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center">
      <div className="group relative flex items-center justify-center">
        {pulse && (
          <motion.span
            aria-hidden
            className="absolute h-14 w-14 rounded-full bg-accent blur-xl motion-reduce:hidden"
            animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.9, 1.2, 0.9] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(SEEN_KEY, "1");
            setPulse(false);
            openWithPrefill();
          }}
          aria-label="Ask Sully"
          className="relative flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-surface shadow-lg transition-transform hover:scale-105"
        >
          <SullyAvatar className="h-7 w-7" colorClass="bg-accent" />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 font-mono text-[0.65rem] text-paper group-hover:block"
        >
          Sully — my agentic copilot
        </span>
      </div>
    </div>
  );
}

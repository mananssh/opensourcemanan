"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// MDXEditor touches browser APIs — load it client-only.
const MdxEditorInner = dynamic(
  () => import("./mdx-editor-inner").then((m) => m.MdxEditorInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[26rem] items-center justify-center rounded-md border border-rule bg-paper font-mono text-sm text-faint">
        Loading editor…
      </div>
    ),
  },
);

/**
 * WYSIWYG MDX editor with local autosave: the body is mirrored into a hidden
 * field (so the form submits it) and continuously saved to localStorage so
 * progress survives an accidental refresh/close. On return, an unsaved draft is
 * restored (with a Discard option).
 */
export function MdxEditor({
  name,
  defaultValue,
  postId,
}: {
  name: string;
  defaultValue?: string;
  postId?: string;
}) {
  const storageKey = `osm:draft:post:${postId ?? "new"}`;
  const initial = useRef(defaultValue ?? "");
  const [markdown, setMarkdown] = useState(defaultValue ?? "");
  const [restored, setRestored] = useState(false);

  // Restore a locally-saved draft on mount (client only).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null && saved !== initial.current) {
        /* eslint-disable react-hooks/set-state-in-effect */
        setMarkdown(saved);
        setRestored(true);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {
      /* localStorage unavailable */
    }
  }, [storageKey]);

  // Debounced autosave.
  useEffect(() => {
    if (markdown === initial.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, markdown);
      } catch {
        /* ignore */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [markdown, storageKey]);

  function discard() {
    setMarkdown(initial.current);
    setRestored(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={markdown} />
      <MdxEditorInner markdown={markdown} onChange={setMarkdown} />
      <div className="mt-2 flex items-center gap-3 font-mono text-[0.7rem] text-faint">
        <span className={restored ? "text-accent" : ""}>
          {restored ? "Unsaved draft restored." : "Autosaves locally as you type."}
        </span>
        <button
          type="button"
          onClick={discard}
          className="underline transition-colors hover:text-accent"
        >
          Discard local draft
        </button>
      </div>
    </div>
  );
}

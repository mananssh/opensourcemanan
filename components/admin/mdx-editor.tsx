"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * MDX body editor with a live preview tab. The preview uses react-markdown for
 * an instant, approximate render — Callouts and syntax highlighting appear on
 * the published page. The textarea stays in the DOM (hidden) so the form still
 * submits its value.
 */
export function MdxEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [preview, setPreview] = useState(false);

  const tab = (active: boolean) =>
    `rounded-full px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] transition-colors ${
      active ? "bg-accent text-white" : "border border-rule text-muted hover:text-accent"
    }`;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <button type="button" onClick={() => setPreview(false)} className={tab(!preview)}>
          Write
        </button>
        <button type="button" onClick={() => setPreview(true)} className={tab(preview)}>
          Preview
        </button>
        <span className="ml-auto font-mono text-[0.65rem] text-faint">
          preview is approximate
        </span>
      </div>

      <div className={preview ? "hidden" : ""}>
        <textarea
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={20}
          className="w-full rounded-md border border-rule bg-paper px-3 py-2 font-mono text-sm text-ink outline-none transition-colors focus:border-accent"
        />
      </div>

      {preview && (
        <div className="blog-prose min-h-[24rem] rounded-md border border-rule bg-paper px-5 py-4">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="font-mono text-sm text-faint">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

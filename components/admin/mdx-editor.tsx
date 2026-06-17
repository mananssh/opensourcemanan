"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// MDXEditor touches browser APIs — load it client-only.
const MdxEditorInner = dynamic(
  () => import("./mdx-editor-inner").then((m) => m.MdxEditorInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[24rem] items-center justify-center rounded-md border border-rule bg-paper font-mono text-sm text-faint">
        Loading editor…
      </div>
    ),
  },
);

/** WYSIWYG MDX editor; mirrors its value into a hidden field so the form submits it. */
export function MdxEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  const [markdown, setMarkdown] = useState(defaultValue ?? "");
  return (
    <div>
      <input type="hidden" name={name} value={markdown} />
      <MdxEditorInner markdown={markdown} onChange={setMarkdown} />
    </div>
  );
}

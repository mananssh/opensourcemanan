"use client";

import "@mdxeditor/editor/style.css";
import { useTheme } from "next-themes";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  markdownShortcutPlugin,
  diffSourcePlugin,
  jsxPlugin,
  GenericJsxEditor,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  ListsToggle,
  InsertCodeBlock,
  InsertTable,
  InsertThematicBreak,
  DiffSourceToggleWrapper,
  type JsxComponentDescriptor,
} from "@mdxeditor/editor";

/** Upload an in-editor image to GCS and return its public URL. */
async function imageUploadHandler(file: File): Promise<string> {
  const res = await fetch("/api/storage/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      vertical: "blog",
      filename: file.name,
      contentType: file.type || "image/jpeg",
    }),
  });
  if (!res.ok) throw new Error("Could not get an upload URL.");
  const { url, key } = (await res.json()) as { url: string; key: string };
  const put = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });
  if (!put.ok) throw new Error("Upload failed.");
  const pub = await fetch("/api/storage/make-public", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!pub.ok) throw new Error("Could not publish image.");
  const { url: publicUrl } = (await pub.json()) as { url: string };
  return publicUrl;
}

// Let custom MDX components (e.g. <Callout>) be edited generically instead of
// crashing the editor.
const jsxDescriptors: JsxComponentDescriptor[] = [
  {
    name: "Callout",
    kind: "flow",
    props: [],
    hasChildren: true,
    Editor: GenericJsxEditor,
  },
];

export function MdxEditorInner({
  markdown,
  onChange,
}: {
  markdown: string;
  onChange: (value: string) => void;
}) {
  const { resolvedTheme } = useTheme();
  return (
    <MDXEditor
      markdown={markdown}
      onChange={onChange}
      className={`rounded-md border border-rule ${resolvedTheme === "dark" ? "dark-theme dark-editor" : ""}`}
      contentEditableClassName="min-h-[24rem]"
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        imagePlugin({ imageUploadHandler }),
        tablePlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: "ts" }),
        codeMirrorPlugin({
          codeBlockLanguages: {
            ts: "TypeScript",
            js: "JavaScript",
            tsx: "TSX",
            bash: "Bash",
            json: "JSON",
            css: "CSS",
            html: "HTML",
            "": "Plain",
          },
        }),
        jsxPlugin({ jsxComponentDescriptors: jsxDescriptors }),
        markdownShortcutPlugin(),
        diffSourcePlugin({ viewMode: "rich-text" }),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <BlockTypeSelect />
              <CreateLink />
              <InsertImage />
              <ListsToggle />
              <InsertCodeBlock />
              <InsertTable />
              <InsertThematicBreak />
            </DiffSourceToggleWrapper>
          ),
        }),
      ]}
    />
  );
}

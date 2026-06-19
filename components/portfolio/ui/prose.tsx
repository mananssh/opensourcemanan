import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Minimal token-styled prose for project/hackathon detail bodies (markdown). */
export function Prose({ children }: { children: string }) {
  if (!children?.trim()) return null;
  return (
    <div className="space-y-4 font-body text-[1.02rem] leading-relaxed text-muted [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-accent-soft [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-ink [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-ink [&_h3]:mt-5 [&_h3]:font-display [&_h3]:text-lg [&_h3]:text-ink [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

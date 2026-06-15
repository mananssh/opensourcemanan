import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getChangelog, type ChangeType } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Everything that has shipped, newest first.",
};

const TYPE_LABELS: Record<ChangeType, string> = {
  feat: "Feature",
  fix: "Fix",
  perf: "Performance",
  refactor: "Refactor",
  docs: "Docs",
  test: "Test",
  chore: "Chore",
  ci: "CI",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function ChangelogPage() {
  const days = getChangelog();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pt-20 sm:pt-28">
      <header>
        <p className="label-caps text-faint">The log</p>
        <h1 className="mt-5 font-display text-5xl font-light tracking-tight text-ink">
          Changelog<span className="text-accent">.</span>
        </h1>
        <p className="mt-4 font-body text-lg italic text-muted">
          Everything that has shipped, newest first.
        </p>
      </header>

      {days.length === 0 ? (
        <p className="mt-16 font-body text-muted">Nothing shipped yet.</p>
      ) : (
        <div className="mt-16 space-y-16">
          {days.map((day) => (
            <section key={day.date}>
              {/* Date divider — mono label + hairline rule */}
              <div className="flex items-center gap-4">
                <span className="label-caps shrink-0 text-faint">
                  {formatDate(day.date)}
                </span>
                <span className="h-px flex-1 bg-rule" />
              </div>

              <ol className="mt-8 space-y-9">
                {day.entries.map((entry, i) => (
                  <li key={`${entry.hash}-${i}`}>
                    <div className="mb-1.5 flex items-center gap-3">
                      <span className="label-caps text-accent">
                        {TYPE_LABELS[entry.type] ?? entry.type}
                      </span>
                      <span className="font-mono text-xs text-faint">
                        {entry.hash}
                      </span>
                    </div>

                    <h2 className="font-display text-xl font-medium leading-snug text-ink">
                      {entry.summary}
                    </h2>

                    {entry.body && (
                      <div className="mt-2 space-y-3 font-body text-[1.0625rem] leading-relaxed text-muted [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-accent-soft [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-ink">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {entry.body}
                        </ReactMarkdown>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

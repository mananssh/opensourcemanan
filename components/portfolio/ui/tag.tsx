import type { ReactNode } from "react";

/** Mono chip for stack/skills/metadata. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-rule px-2.5 py-0.5 font-mono text-[0.7rem] text-muted">
      {children}
    </span>
  );
}

/** Accent-tinted chip for an award/result — color earns its keep here. */
export function AwardTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-[0.7rem] text-accent">
      {children}
    </span>
  );
}

"use client";

import { useEffect } from "react";

export default function PortfolioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portfolio]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="label-caps text-faint">error</p>
      <h1 className="font-display text-5xl font-light tracking-tight text-ink">
        Something didn&apos;t load<span className="text-accent">.</span>
      </h1>
      <button
        type="button"
        onClick={reset}
        className="label-caps text-accent transition-opacity hover:opacity-70"
      >
        try again →
      </button>
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getViewer } from "@/lib/movies/identity";
import { HandleForm } from "@/components/movies/handle-form";

export const metadata: Metadata = { title: "Pick your handle" };

export default async function WelcomePage() {
  await requireAuth();
  if (await getViewer()) redirect("/movies");

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-accent-2">
        ●REC · New here
      </p>
      <h1 className="vhs-title mt-4 font-display text-5xl tracking-[0.03em] text-ink sm:text-6xl">
        Claim your handle<span className="text-accent">.</span>
      </h1>
      <p className="mt-5 max-w-lg font-body text-lg leading-relaxed text-muted">
        This is how friends find you — they&rsquo;ll follow you by your exact
        @handle. It becomes your public reel&rsquo;s address, so pick something
        you like.
      </p>
      <HandleForm />
    </div>
  );
}

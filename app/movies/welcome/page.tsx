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
    <div className="mx-auto w-full max-w-3xl overflow-x-clip px-6 py-16 sm:py-24">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-accent-2">
        Claim a stall
      </p>
      <h1 className="reel-wordmark mt-4 font-display text-[clamp(3rem,10vw,5.5rem)] text-ink">
        Handle
      </h1>
      <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
        This is how friends find you — they follow the exact @handle. It becomes
        your public reel&rsquo;s address.
      </p>
      <HandleForm />
    </div>
  );
}

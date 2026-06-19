import Image from "next/image";
import { publicUrl } from "@/lib/storage/gcs";
import { Particles } from "@/components/portfolio/hero/particles";
import { ScrambleText } from "@/components/portfolio/hero/scramble-text";
import { AgentConsole } from "@/components/portfolio/agent/agent-console";
import type { Profile } from "@/db/schema";

const chip =
  "rounded-full border border-rule bg-surface/80 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted backdrop-blur";

export function Hero({
  profile,
  resume,
}: {
  profile: Profile | null;
  resume: string | null;
}) {
  const photo = profile?.photoKey ? publicUrl(profile.photoKey) : null;

  return (
    <section className="relative overflow-hidden border-b border-rule">
      <Particles className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-16 pt-20 sm:pt-28">
        <ScrambleText
          text="● software / ai-native engineer"
          className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent"
        />
        <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
          {profile?.name || "Manan Shah"}
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-5 max-w-xl font-body text-lg leading-relaxed text-muted">
          Paste a role. I&rsquo;ll tell you — honestly — whether I&rsquo;m a fit,
          and show the evidence.
        </p>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[0.85fr_1fr]">
          {/* Photo + floating telemetry chips */}
          <div className="relative mx-auto w-full max-w-[20rem] lg:mx-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-rule bg-surface">
              {photo ? (
                <Image
                  src={photo}
                  alt={profile?.name ? `${profile.name} portrait` : "Portrait"}
                  fill
                  sizes="(max-width: 1024px) 80vw, 320px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faint">
                  portrait
                </div>
              )}
            </div>
            {profile?.location && (
              <span className={`float-soft absolute -left-3 top-6 ${chip}`}>
                {profile.location}
              </span>
            )}
            {profile?.tagline && (
              <span className={`float-soft d1 absolute -right-3 top-1/3 ${chip}`}>
                {profile.tagline}
              </span>
            )}
            <span className={`float-soft d2 absolute -bottom-3 left-8 ${chip}`}>
              available — ai / swe roles
            </span>
          </div>

          {/* The instrument: agent console (centerpiece) */}
          <div>
            <AgentConsole />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {profile?.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center rounded-lg border border-rule px-4 py-2 font-mono text-sm text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  Email Manan
                </a>
              )}
              {resume && (
                <a
                  href={resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-accent underline underline-offset-4"
                >
                  Résumé
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import { publicUrl } from "@/lib/storage/gcs";
import { Particles } from "@/components/portfolio/hero/particles";
import { ScrambleText } from "@/components/portfolio/hero/scramble-text";
import { OttoPanel } from "@/components/portfolio/agent/otto-panel";
import type { Profile } from "@/db/schema";

export function Hero({ profile }: { profile: Profile | null }) {
  const photo = profile?.photoKey ? publicUrl(profile.photoKey) : null;

  return (
    <section className="relative overflow-hidden border-b border-rule">
      <Particles className="pointer-events-none absolute inset-0 h-full w-full" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-16 pt-20 sm:pt-24">
        <div className="flex flex-col-reverse items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <ScrambleText
              text="● a (slightly biased) second opinion"
              className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent"
            />
            <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              <span className="text-muted">Everyone can talk about what they do.</span>
              <br />
              <span className="font-semibold text-ink">Let me show you instead.</span>
            </h1>
            <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-muted">
              Meet <span className="font-medium text-ink">Otto</span>, my autopilot
              — he&rsquo;s read everything I&rsquo;ve built. Paste a role you&rsquo;re
              hiring for and he&rsquo;ll map it to my background in real time, then
              call it: strong fit or not, and why. He&rsquo;s biased, obviously —
              but only a little.
            </p>
          </div>

          {/* Portrait — a clean rounded frame with a coral edge, not a card. */}
          <div className="relative shrink-0">
            <div className="relative h-36 w-36 overflow-hidden rounded-2xl ring-2 ring-accent/70 sm:h-44 sm:w-44">
              {photo ? (
                <Image
                  src={photo}
                  alt={profile?.name ? `${profile.name} portrait` : "Portrait"}
                  fill
                  sizes="176px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface font-mono text-[0.6rem] uppercase tracking-[0.2em] text-faint">
                  portrait
                </div>
              )}
            </div>
            {profile?.location && (
              <span className="float-soft absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-rule bg-surface/90 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted backdrop-blur">
                {profile.location}
              </span>
            )}
          </div>
        </div>

        {/* The instrument: full-width agent */}
        <div className="mt-12">
          <OttoPanel />
        </div>
      </div>
    </section>
  );
}

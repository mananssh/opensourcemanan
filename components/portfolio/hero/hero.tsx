import Image from "next/image";
import { publicUrl } from "@/lib/storage/gcs";
import { ScrambleText } from "@/components/portfolio/hero/scramble-text";
import type { Profile } from "@/db/schema";

export function Hero({ profile }: { profile: Profile | null }) {
  const photo = profile?.photoKey ? publicUrl(profile.photoKey) : null;
  const first = profile?.name?.split(" ")[0] || "Manan";

  return (
    <section className="border-b border-rule">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-6 pb-20 pt-20 sm:pt-28 lg:grid-cols-[1fr_0.82fr]">
        <div>
          <ScrambleText
            text="● software / ai-native engineer"
            className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent"
          />
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
            Hi, I&rsquo;m {first}
            <span className="text-accent">.</span>
          </h1>
          {profile?.intro && (
            <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-muted">
              {profile.intro}
            </p>
          )}
        </div>

        {/* Big portrait */}
        <div className="relative mx-auto w-full max-w-sm lg:mx-0">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-rule bg-surface ring-1 ring-accent/40">
            {photo ? (
              <Image
                src={photo}
                alt={profile?.name ? `${profile.name} portrait` : "Portrait"}
                fill
                sizes="(max-width: 1024px) 90vw, 384px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
                portrait
              </div>
            )}
          </div>
          {profile?.location && (
            <span className="float-soft absolute -bottom-3 left-6 whitespace-nowrap rounded-full border border-rule bg-surface/90 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted backdrop-blur">
              {profile.location}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

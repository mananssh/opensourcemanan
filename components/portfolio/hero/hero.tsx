import Image from "next/image";
import { publicUrl } from "@/lib/storage/gcs";
import { ScrambleText } from "@/components/portfolio/hero/scramble-text";
import type { Profile } from "@/db/schema";

/** A résumé value may be a full URL or a GCS key. */
function resolveUrl(v: string | null | undefined): string | null {
  if (!v) return null;
  return /^https?:\/\//.test(v) ? v : publicUrl(v);
}

export function Hero({ profile }: { profile: Profile | null }) {
  const photo = profile?.photoKey ? publicUrl(profile.photoKey) : null;
  const first = profile?.name?.split(" ")[0] || "Manan";
  const resume = resolveUrl(profile?.resumeKey);

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
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {resume && (
              <a
                href={resume}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-medium text-accent-ink shadow-[0_14px_34px_-16px_var(--accent)] transition-transform hover:-translate-y-0.5"
              >
                Résumé <span aria-hidden>↗</span>
              </a>
            )}
            <a
              href="#sully"
              className="inline-flex items-center gap-2 rounded-lg border border-rule px-5 py-2.5 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent"
            >
              Ask Sully about a role
            </a>
          </div>
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

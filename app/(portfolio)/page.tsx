import Link from "next/link";
import {
  getProfile,
  listProjects,
  listHackathons,
  listExperiences,
  listCapabilities,
} from "@/lib/portfolio/queries";
import { publicUrl } from "@/lib/storage/gcs";
import { SectionHeading } from "@/components/portfolio/ui/section-heading";
import { Tag, AwardTag } from "@/components/portfolio/ui/tag";
import { Timeline } from "@/components/portfolio/sections/timeline";

const wrap = "mx-auto w-full max-w-5xl px-6";

/** A résumé value may be a full URL or a GCS key. */
function resolveUrl(v: string | null): string | null {
  if (!v) return null;
  return /^https?:\/\//.test(v) ? v : publicUrl(v);
}

export default async function PortfolioLanding() {
  const [profile, projects, hackathons, experiences, capabilities] =
    await Promise.all([
      getProfile(),
      listProjects(),
      listHackathons(),
      listExperiences(),
      listCapabilities(),
    ]);

  const featured = projects.filter((p) => p.featured);
  const shownProjects = featured.length ? featured : projects.slice(0, 3);
  const resume = resolveUrl(profile?.resumeKey ?? null);

  return (
    <div className="pb-28">
      {/* Hero (skeleton — the photo + particles + agent console land in the next pass) */}
      <section className={`${wrap} pt-20 sm:pt-28`}>
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-faint">
          {profile?.tagline || "Software / AI-native engineer"}
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
          {profile?.name || "Manan Shah"}
          <span className="text-accent">.</span>
        </h1>
        {profile?.intro && (
          <p className="mt-6 max-w-prose font-body text-lg leading-relaxed text-muted">
            {profile.intro}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {profile?.email && (
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center rounded-lg bg-accent px-4 py-2 font-mono text-sm text-accent-ink transition-opacity hover:opacity-90"
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
        <p className="mt-10 max-w-prose rounded-lg border border-dashed border-rule px-4 py-3 font-mono text-xs text-faint">
          ● reserved — an interactive “assess my fit” console is coming online here.
        </p>
      </section>

      {/* Now */}
      {profile?.now && (
        <section className={`${wrap} mt-28`}>
          <SectionHeading eyebrow="Now" title="What I'm building" />
          <p className="max-w-prose font-body text-lg leading-relaxed text-ink">
            {profile.now}
          </p>
        </section>
      )}

      {/* Selected work */}
      {shownProjects.length > 0 && (
        <section className={`${wrap} mt-28`}>
          <SectionHeading eyebrow="Selected work" title="Things I've built" />
          <ul className="space-y-10">
            {shownProjects.map((p) => (
              <li key={p.id} className="border-t border-rule pt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  <h3 className="font-display text-2xl font-medium text-ink">{p.name}</h3>
                  {p.award && <AwardTag>{p.award}</AwardTag>}
                </div>
                {p.blurb && (
                  <p className="mt-2 max-w-prose font-body text-muted">{p.blurb}</p>
                )}
                {p.stack.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.stack.map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Proof */}
      {hackathons.length > 0 && (
        <section className={`${wrap} mt-28`}>
          <SectionHeading eyebrow="Proof" title="Hackathons & wins" />
          <ul className="space-y-6">
            {hackathons.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-rule pt-4"
              >
                <div>
                  <span className="font-display text-lg text-ink">{h.event}</span>
                  {h.blurb && (
                    <p className="mt-1 max-w-prose font-body text-sm text-muted">
                      {h.blurb}
                    </p>
                  )}
                </div>
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-accent">
                  {h.result}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section className={`${wrap} mt-28`}>
          <SectionHeading eyebrow="Experience" title="Where I've worked" />
          <Timeline items={experiences} />
        </section>
      )}

      {/* Capabilities */}
      {capabilities.length > 0 && (
        <section className={`${wrap} mt-28`}>
          <SectionHeading eyebrow="Capabilities" title="The stack" />
          <div className="space-y-6">
            {capabilities.map((c) => (
              <div key={c.id} className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <p className="w-40 shrink-0 font-mono text-xs uppercase tracking-[0.12em] text-faint">
                  {c.groupName}
                </p>
                <div className="flex flex-wrap gap-2">
                  {c.items.map((it) => (
                    <Tag key={it}>{it}</Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {profile && profile.languages.length > 0 && (
            <p className="mt-8 font-body text-sm text-muted">
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-faint">
                Spoken{" "}
              </span>
              {profile.languages
                .map((l) => (l.level ? `${l.name} (${l.level})` : l.name))
                .join(" · ")}
            </p>
          )}
        </section>
      )}

      {/* Contact */}
      <section className={`${wrap} mt-28`}>
        <SectionHeading eyebrow="Contact" title="Get in touch" />
        <div className="flex flex-wrap gap-x-8 gap-y-3 font-body">
          {profile?.email && (
            <a href={`mailto:${profile.email}`} className="text-accent underline underline-offset-4">
              {profile.email}
            </a>
          )}
          {profile?.linkedin && (
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
              LinkedIn
            </a>
          )}
          {profile?.github && (
            <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
              GitHub
            </a>
          )}
          <Link href="/osm" className="text-muted underline underline-offset-4">
            the rest of OSM
          </Link>
        </div>
      </section>
    </div>
  );
}

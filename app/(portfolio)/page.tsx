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
import { Hero } from "@/components/portfolio/hero/hero";
import { SullySection } from "@/components/portfolio/agent/sully-section";

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
      <Hero profile={profile} />

      <SullySection />

      {/* Selected work */}
      {shownProjects.length > 0 && (
        <section id="work" className={`${wrap} mt-28 scroll-mt-20`}>
          <SectionHeading eyebrow="Selected work" title="Things I've built" />
          <ul className="space-y-10">
            {shownProjects.map((p) => (
              <li key={p.id} className="border-t border-rule pt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  <Link
                    href={`/work/${p.slug}`}
                    className="font-display text-2xl font-medium text-ink transition-colors hover:text-accent"
                  >
                    {p.name}
                  </Link>
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
          <div className="mt-8">
            <Link href="/work" className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
              All work →
            </Link>
          </div>
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
                  <Link
                    href={`/hackathons/${h.slug}`}
                    className="font-display text-lg text-ink transition-colors hover:text-accent"
                  >
                    {h.event}
                  </Link>
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
          <div className="mt-8">
            <Link href="/hackathons" className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
              All hackathons →
            </Link>
          </div>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section id="experience" className={`${wrap} mt-28 scroll-mt-20`}>
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
          {resume && (
            <a href={resume} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
              Résumé
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

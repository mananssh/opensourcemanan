import Link from "next/link";
import {
  getProfile,
  listProjects,
  listHackathons,
  listExperiences,
  listCapabilities,
} from "@/lib/portfolio/queries";
import { SectionHeading } from "@/components/portfolio/ui/section-heading";
import { Tag, AwardTag } from "@/components/portfolio/ui/tag";
import { Timeline } from "@/components/portfolio/sections/timeline";
import { Hero } from "@/components/portfolio/hero/hero";
import { SullySection } from "@/components/portfolio/agent/sully-section";

// Each content section floats as a translucent glass panel over the particle
// field — legible, separated, but never fully opaque.
const sectionOuter = "mx-auto w-full max-w-5xl px-6 mt-14 scroll-mt-24";
const panel = "section-glass p-6 sm:p-10";

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

  return (
    <div className="pb-28">
      <Hero profile={profile} />

      <SullySection />

      {/* Selected work — each row is a single clickable card */}
      {shownProjects.length > 0 && (
        <section id="work" className={sectionOuter}>
          <div className={panel}>
            <SectionHeading eyebrow="Selected work" title="Things I've built" />
            <ul className="space-y-3">
              {shownProjects.map((p) => (
                <li key={p.id}>
                  <Link href={`/work/${p.slug}`} className="lift-card group block px-5 py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                      <h3 className="font-display text-2xl font-medium text-ink transition-colors group-hover:text-accent">
                        {p.name}
                      </h3>
                      {p.award && <AwardTag>{p.award}</AwardTag>}
                    </div>
                    {p.blurb && <p className="mt-2 max-w-prose font-body text-muted">{p.blurb}</p>}
                    {p.stack.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.stack.map((s) => (
                          <Tag key={s}>{s}</Tag>
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <Link href="/work" className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                All work →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Proof — each win is a clickable card */}
      {hackathons.length > 0 && (
        <section id="hackathons" className={sectionOuter}>
          <div className={panel}>
            <SectionHeading eyebrow="Proof" title="Hackathons & wins" />
            <ul className="space-y-3">
              {hackathons.map((h) => (
                <li key={h.id}>
                  <Link
                    href={`/hackathons/${h.slug}`}
                    className="lift-card group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <h3 className="font-display text-lg text-ink transition-colors group-hover:text-accent">
                        {h.event}
                      </h3>
                      {h.blurb && (
                        <p className="mt-1 max-w-prose font-body text-sm text-muted">{h.blurb}</p>
                      )}
                    </div>
                    <span className="font-mono text-xs uppercase tracking-[0.12em] text-accent">
                      {h.result}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <Link href="/hackathons" className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                All hackathons →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <section id="experience" className={sectionOuter}>
          <div className={panel}>
            <SectionHeading eyebrow="Experience" title="Where I've worked" />
            <Timeline items={experiences} />
            <div className="mt-7">
              <Link href="/experience" className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                Full timeline →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Capabilities */}
      {capabilities.length > 0 && (
        <section id="capabilities" className={sectionOuter}>
          <div className={panel}>
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
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-faint">Spoken </span>
                {profile.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join(" · ")}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className={sectionOuter}>
        <div className={panel}>
          <SectionHeading eyebrow="Contact" title="Let's talk" />
          <div className="grid gap-8 sm:grid-cols-[1.15fr_1fr]">
            <div>
              <p className="max-w-prose font-body text-muted">
                Building something where I&rsquo;d be useful — or just want to compare notes? The
                fastest ways to reach me:
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                {profile?.email && (
                  <ContactRow label="Email" value={profile.email} href={`mailto:${profile.email}`} />
                )}
                {profile?.linkedin && (
                  <ContactRow label="LinkedIn" value="in/manan" href={profile.linkedin} external />
                )}
                {profile?.github && (
                  <ContactRow label="GitHub" value="@mananssh" href={profile.github} external />
                )}
              </div>
            </div>
            <div className="border-t border-rule pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">What is OSM?</p>
              <p className="mt-3 max-w-prose font-body text-sm leading-relaxed text-muted">
                This portfolio is one vertical of <span className="text-ink">opensourcemanan</span> — an
                all-in-one personal platform I build <span className="text-ink">in the open</span>:
                portfolio, a live AI agent, a blog and more, all on shared primitives.
              </p>
              <Link
                href="/osm"
                className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-accent transition-opacity hover:opacity-80"
              >
                The manifesto →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** A labelled, clickable contact method (reuses the glass lift-card). */
function ContactRow({
  label,
  value,
  href,
  external,
}: {
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="lift-card group flex items-center justify-between gap-4 px-4 py-3"
    >
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-faint">{label}</span>
      <span className="truncate font-body text-ink transition-colors group-hover:text-accent">
        {value} <span aria-hidden>↗</span>
      </span>
    </a>
  );
}

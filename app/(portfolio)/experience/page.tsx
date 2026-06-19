import type { Metadata } from "next";
import Link from "next/link";
import { listExperiences } from "@/lib/portfolio/queries";
import { SectionHeading } from "@/components/portfolio/ui/section-heading";
import { Timeline } from "@/components/portfolio/sections/timeline";

export const metadata: Metadata = {
  title: "Experience",
  description: "Where I've worked — roles, dates, and what I built.",
};

export default async function ExperiencePage() {
  const experiences = await listExperiences();
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-28 pt-20 sm:pt-24">
      <SectionHeading
        eyebrow="Experience"
        title="Where I've worked"
        subtitle="Click any role for the full story."
      />
      {experiences.length > 0 ? (
        <Timeline items={experiences} />
      ) : (
        <p className="font-body text-muted">Nothing here yet.</p>
      )}
      <div className="mt-12">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
        >
          ← back home
        </Link>
      </div>
    </div>
  );
}

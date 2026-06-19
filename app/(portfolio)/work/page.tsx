import type { Metadata } from "next";
import Link from "next/link";
import { listProjects } from "@/lib/portfolio/queries";
import { publicUrl } from "@/lib/storage/gcs";
import { SectionHeading } from "@/components/portfolio/ui/section-heading";
import { ProjectGrid } from "@/components/portfolio/work/project-grid";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected projects — what they do, the stack, and the wins.",
};

export default async function WorkPage() {
  const projects = (await listProjects()).map((p) => ({
    ...p,
    coverUrl: p.coverImageKey ? publicUrl(p.coverImageKey) : null,
  }));
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-28 pt-20 sm:pt-24">
      <SectionHeading
        eyebrow="Selected work"
        title="Things I've built"
        subtitle="Click any project for the full story."
      />
      {projects.length > 0 ? (
        <ProjectGrid projects={projects} />
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

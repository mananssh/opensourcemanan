import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/portfolio/queries";
import { ProjectDetail } from "@/components/portfolio/work/project-detail";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProject(slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.name,
    description: p.blurb || undefined,
    alternates: { canonical: `/work/${slug}` },
  };
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-28 pt-20 sm:pt-24">
      <Link
        href="/work"
        className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
      >
        ← all work
      </Link>
      <div className="mt-6">
        <ProjectDetail project={project} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExperienceById } from "@/lib/portfolio/queries";
import { ExperienceDetail } from "@/components/portfolio/experience/experience-detail";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const e = await getExperienceById(id);
  if (!e) return { title: "Not found" };
  return { title: `${e.role} · ${e.org}`, description: e.blurb || undefined };
}

export default async function ExperiencePageDetail({ params }: { params: Params }) {
  const { id } = await params;
  const experience = await getExperienceById(id);
  if (!experience) notFound();
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-28 pt-20 sm:pt-24">
      <Link
        href="/experience"
        className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
      >
        ← all experience
      </Link>
      <div className="mt-6">
        <ExperienceDetail experience={experience} />
      </div>
    </div>
  );
}

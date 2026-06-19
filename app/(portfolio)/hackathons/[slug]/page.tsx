import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHackathon } from "@/lib/portfolio/queries";
import { HackathonDetail } from "@/components/portfolio/hackathons/hackathon-detail";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const h = await getHackathon(slug);
  if (!h) return { title: "Not found" };
  return {
    title: `${h.event} — ${h.result}`,
    description: h.blurb || undefined,
    alternates: { canonical: `/hackathons/${slug}` },
  };
}

export default async function HackathonPage({ params }: { params: Params }) {
  const { slug } = await params;
  const hackathon = await getHackathon(slug);
  if (!hackathon) notFound();
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-28 pt-20 sm:pt-24">
      <Link
        href="/hackathons"
        className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
      >
        ← all hackathons
      </Link>
      <div className="mt-6">
        <HackathonDetail hackathon={hackathon} />
      </div>
    </div>
  );
}

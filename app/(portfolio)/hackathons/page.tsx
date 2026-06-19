import type { Metadata } from "next";
import Link from "next/link";
import { listHackathons } from "@/lib/portfolio/queries";
import { publicUrl } from "@/lib/storage/gcs";
import { SectionHeading } from "@/components/portfolio/ui/section-heading";
import { HackathonShowcase } from "@/components/portfolio/hackathons/hackathon-showcase";

export const metadata: Metadata = {
  title: "Hackathons",
  description: "A wall of hackathon wins — the event, the result, the build.",
};

export default async function HackathonsPage() {
  const hackathons = (await listHackathons()).map((h) => ({
    ...h,
    coverUrl: h.coverImageKey ? publicUrl(h.coverImageKey) : null,
  }));
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-28 pt-20 sm:pt-24">
      <SectionHeading
        eyebrow="Proof"
        title="Hackathons & wins"
        subtitle="Click any win for the full story."
      />
      {hackathons.length > 0 ? (
        <HackathonShowcase hackathons={hackathons} />
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

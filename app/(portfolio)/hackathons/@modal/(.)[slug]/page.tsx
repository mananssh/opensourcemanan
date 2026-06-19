import { notFound } from "next/navigation";
import { getHackathon } from "@/lib/portfolio/queries";
import { HackathonDetail } from "@/components/portfolio/hackathons/hackathon-detail";
import { DetailModal } from "@/components/portfolio/ui/detail-modal";
import { portfolioScope } from "@/lib/portfolio/fonts";

export default async function HackathonModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hackathon = await getHackathon(slug);
  if (!hackathon) notFound();
  return (
    <DetailModal scopeClass={portfolioScope}>
      <HackathonDetail hackathon={hackathon} />
    </DetailModal>
  );
}

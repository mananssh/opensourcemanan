import { notFound } from "next/navigation";
import { getExperienceById } from "@/lib/portfolio/queries";
import { ExperienceDetail } from "@/components/portfolio/experience/experience-detail";
import { DetailModal } from "@/components/portfolio/ui/detail-modal";
import { portfolioScope } from "@/lib/portfolio/fonts";

export default async function ExperienceModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const experience = await getExperienceById(id);
  if (!experience) notFound();
  return (
    <DetailModal scopeClass={portfolioScope}>
      <ExperienceDetail experience={experience} />
    </DetailModal>
  );
}

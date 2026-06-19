import { notFound } from "next/navigation";
import { getProject } from "@/lib/portfolio/queries";
import { ProjectDetail } from "@/components/portfolio/work/project-detail";
import { DetailModal } from "@/components/portfolio/ui/detail-modal";
import { portfolioScope } from "@/lib/portfolio/fonts";

export default async function ProjectModal({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  return (
    <DetailModal scopeClass={portfolioScope}>
      <ProjectDetail project={project} />
    </DetailModal>
  );
}

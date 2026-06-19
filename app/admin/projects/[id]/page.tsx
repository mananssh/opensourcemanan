import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/portfolio/queries";
import { ProjectForm } from "@/components/portfolio/admin/project-form";

export default async function AdminProjectEdit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "new") {
    return (
      <div>
        <h1 className="mb-6 font-display text-3xl font-semibold text-ink">New project</h1>
        <ProjectForm />
      </div>
    );
  }
  const project = await getProjectById(id);
  if (!project) notFound();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">
        Edit {project.name}
      </h1>
      <ProjectForm project={project} />
    </div>
  );
}

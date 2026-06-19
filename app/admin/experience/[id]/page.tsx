import { notFound } from "next/navigation";
import { getExperienceById } from "@/lib/portfolio/queries";
import { ExperienceForm } from "@/components/portfolio/admin/experience-form";

export default async function AdminExperienceEdit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "new") {
    return (
      <div>
        <h1 className="mb-6 font-display text-3xl font-semibold text-ink">New experience</h1>
        <ExperienceForm />
      </div>
    );
  }
  const experience = await getExperienceById(id);
  if (!experience) notFound();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">
        Edit {experience.role} · {experience.org}
      </h1>
      <ExperienceForm experience={experience} />
    </div>
  );
}

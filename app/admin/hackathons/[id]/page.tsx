import { notFound } from "next/navigation";
import { getHackathonById, listProjects } from "@/lib/portfolio/queries";
import { HackathonForm } from "@/components/portfolio/admin/hackathon-form";

export default async function AdminHackathonEdit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectOptions = (await listProjects()).map((p) => ({ slug: p.slug, name: p.name }));
  if (id === "new") {
    return (
      <div>
        <h1 className="mb-6 font-display text-3xl font-semibold text-ink">New hackathon</h1>
        <HackathonForm projects={projectOptions} />
      </div>
    );
  }
  const hackathon = await getHackathonById(id);
  if (!hackathon) notFound();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">
        Edit {hackathon.event}
      </h1>
      <HackathonForm hackathon={hackathon} projects={projectOptions} />
    </div>
  );
}

import { notFound } from "next/navigation";
import { getCapabilityById } from "@/lib/portfolio/queries";
import { CapabilityForm } from "@/components/portfolio/admin/capability-form";

export default async function AdminCapabilityEdit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "new") {
    return (
      <div>
        <h1 className="mb-6 font-display text-3xl font-semibold text-ink">New group</h1>
        <CapabilityForm />
      </div>
    );
  }
  const capability = await getCapabilityById(id);
  if (!capability) notFound();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">
        Edit {capability.groupName}
      </h1>
      <CapabilityForm capability={capability} />
    </div>
  );
}

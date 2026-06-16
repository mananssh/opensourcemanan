import { notFound } from "next/navigation";
import { adminGetCategory } from "@/lib/blog/admin";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata = { title: "Edit category" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await adminGetCategory(id);
  if (!category) notFound();
  return (
    <div>
      <h1 className="mb-8 font-display text-2xl font-bold text-ink">Edit category</h1>
      <CategoryForm category={category} />
    </div>
  );
}

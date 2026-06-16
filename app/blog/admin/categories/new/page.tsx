import { CategoryForm } from "@/components/admin/category-form";

export const metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="mb-8 font-display text-2xl font-bold text-ink">New category</h1>
      <CategoryForm />
    </div>
  );
}

import { adminListCategories } from "@/lib/blog/admin";
import { PostForm } from "@/components/admin/post-form";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  const categories = await adminListCategories();
  return (
    <div>
      <h1 className="mb-8 font-display text-2xl font-bold text-ink">New post</h1>
      <PostForm categories={categories} />
    </div>
  );
}

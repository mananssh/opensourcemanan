import { notFound } from "next/navigation";
import {
  adminGetPost,
  adminListCategories,
  adminGetPostTagNames,
} from "@/lib/blog/admin";
import { PostForm } from "@/components/admin/post-form";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories, tagNames] = await Promise.all([
    adminGetPost(id),
    adminListCategories(),
    adminGetPostTagNames(id),
  ]);
  if (!post) notFound();
  return (
    <div>
      <h1 className="mb-8 font-display text-2xl font-bold text-ink">Edit post</h1>
      <PostForm post={post} categories={categories} tagNames={tagNames} />
    </div>
  );
}

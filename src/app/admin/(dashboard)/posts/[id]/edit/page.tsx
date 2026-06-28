import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PostForm from "@/components/PostForm";
import { updatePost } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  const [post, allLabels] = await Promise.all([
    prisma.post.findUnique({
      where: { id: params.id },
      include: { labels: { include: { label: true } } },
    }),
    prisma.label.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
  ]);

  if (!post) notFound();

  // Bind the post id as the first argument of the (id, prev, formData) action.
  const action = updatePost.bind(null, post.id);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
        Edit post
      </h1>
      <PostForm
        action={action}
        allLabels={allLabels}
        flashMessage={searchParams.created ? "Post created." : undefined}
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          contentHtml: post.contentHtml,
          coverImageUrl: post.coverImageUrl ?? "",
          published: post.published,
          labels: post.labels.map((l) => l.label.name),
        }}
      />
    </div>
  );
}

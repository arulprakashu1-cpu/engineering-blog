import { prisma } from "@/lib/prisma";
import PostForm from "@/components/PostForm";
import { createPost } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const allLabels = await prisma.label.findMany({
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
        New post
      </h1>
      <PostForm
        action={createPost}
        allLabels={allLabels}
        initial={{
          title: "",
          slug: "",
          excerpt: "",
          contentHtml: "",
          coverImageUrl: "",
          published: false,
          labels: [],
        }}
      />
    </div>
  );
}

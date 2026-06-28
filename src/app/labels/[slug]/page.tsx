import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import Sidebar from "@/components/Sidebar";
import { getLabelBySlug, getPublishedPosts } from "@/lib/posts";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const label = await getLabelBySlug(params.slug);
  if (!label) return { title: "Label not found" };
  return {
    title: `Posts labeled “${label.name}”`,
    description: `All posts tagged ${label.name}.`,
  };
}

export default async function LabelPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const label = await getLabelBySlug(params.slug);
  if (!label) notFound();

  const page = Number(searchParams.page ?? "1") || 1;
  const { posts, total, pageSize } = await getPublishedPosts({
    page,
    labelSlug: params.slug,
  });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_260px]">
      <div>
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
          Posts labeled{" "}
          <span className="text-brand-600">{label.name}</span>
        </h1>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            No posts with this label yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          baseParams={new URLSearchParams()}
          basePath={`/labels/${params.slug}`}
        />
      </div>

      <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
        <Sidebar activeLabel={params.slug} />
      </Suspense>
    </div>
  );
}

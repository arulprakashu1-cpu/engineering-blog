import { Suspense } from "react";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import SearchBox from "@/components/SearchBox";
import Sidebar from "@/components/Sidebar";
import { getPublishedPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

// Revalidate the home list periodically (ISR). On-demand revalidation in the
// admin actions keeps it fresh immediately after edits.
export const revalidate = 60;

type SearchParams = {
  q?: string;
  page?: string;
  month?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Number(searchParams.page ?? "1") || 1;
  const search = searchParams.q?.trim() || undefined;
  const month = searchParams.month || undefined;

  const { posts, total, pageSize } = await getPublishedPosts({
    page,
    search,
    month,
  });

  // Base params for pagination links (everything except `page`).
  const baseParams = new URLSearchParams();
  if (search) baseParams.set("q", search);
  if (month) baseParams.set("month", month);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_260px]">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {siteConfig.name}
          </h1>
          <p className="mt-1 text-slate-600">{siteConfig.description}</p>
        </div>

        <div className="mb-6">
          <Suspense fallback={<div className="h-10" />}>
            <SearchBox />
          </Suspense>
        </div>

        {(search || month) && (
          <p className="mb-4 text-sm text-slate-500">
            {total} result{total === 1 ? "" : "s"}
            {search && (
              <>
                {" "}
                for “<span className="font-medium">{search}</span>”
              </>
            )}
            {month && <> in this month</>}
          </p>
        )}

        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            No posts found.
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
          baseParams={baseParams}
        />
      </div>

      <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
        <Sidebar />
      </Suspense>
    </div>
  );
}

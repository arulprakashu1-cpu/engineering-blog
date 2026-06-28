import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeletePostButton from "@/components/DeletePostButton";
import TogglePublishButton from "@/components/TogglePublishButton";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: { deleted?: string };
}) {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { labels: { include: { label: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Posts <span className="text-base font-normal text-slate-400">({posts.length})</span>
        </h1>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New post
        </Link>
      </div>

      {searchParams.deleted && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Post deleted.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Labels</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No posts yet.{" "}
                  <Link href="/admin/posts/new" className="text-brand-600 hover:underline">
                    Create your first post
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {post.title}
                  </td>
                  <td className="px-4 py-3">
                    {post.published ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {post.labels.map((l) => (
                        <span
                          key={l.labelId}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                        >
                          {l.label.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(post.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      {post.published && (
                        <Link
                          href={`/posts/${post.slug}`}
                          target="_blank"
                          className="text-sm font-medium text-slate-600 hover:text-brand-600"
                        >
                          View
                        </Link>
                      )}
                      <TogglePublishButton
                        postId={post.id}
                        published={post.published}
                      />
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        Edit
                      </Link>
                      <DeletePostButton
                        postId={post.id}
                        title={post.title}
                        compact
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import type { PostListItem } from "@/lib/posts";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PostCard({ post }: { post: PostListItem }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {post.coverImageUrl ? (
        <Link href={`/posts/${post.slug}`} className="relative block aspect-[16/9] w-full bg-slate-100">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </Link>
      ) : (
        <Link
          href={`/posts/${post.slug}`}
          className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400"
        >
          <span className="text-sm">No cover image</span>
        </Link>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <time className="text-slate-500">{formatDate(post.createdAt)}</time>
          {!post.published && (
            <span className="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
              Draft
            </span>
          )}
        </div>

        <h2 className="text-lg font-semibold leading-snug text-slate-900">
          <Link href={`/posts/${post.slug}`} className="hover:text-brand-600">
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="line-clamp-3 flex-1 text-sm text-slate-600">{post.excerpt}</p>
        )}

        {post.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {post.labels.map((label) => (
              <Link
                key={label.slug}
                href={`/labels/${label.slug}`}
                className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
              >
                {label.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

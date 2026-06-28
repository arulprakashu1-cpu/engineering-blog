import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostContent from "@/components/PostContent";
import CommentForm from "@/components/CommentForm";
import { getPublishedPostBySlug } from "@/lib/posts";
import { sanitizePostHtml, stripAllHtml } from "@/lib/sanitize";
import { siteConfig } from "@/lib/site";

export const revalidate = 60;

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) return { title: "Post not found" };

  const description =
    post.excerpt || stripAllHtml(post.contentHtml).slice(0, 160);
  const url = `${siteConfig.url}/posts/${post.slug}`;

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) notFound();

  // SERVER-SIDE sanitization before the HTML ever reaches the browser.
  const safeHtml = sanitizePostHtml(post.contentHtml);

  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/" className="text-sm text-brand-600 hover:text-brand-700">
        ← Back to posts
      </Link>

      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <time dateTime={post.createdAt.toISOString()}>
            {formatDate(post.createdAt)}
          </time>
          {post.labels.length > 0 && <span>·</span>}
          <div className="flex flex-wrap gap-2">
            {post.labels.map((l) => (
              <Link
                key={l.label.slug}
                href={`/labels/${l.label.slug}`}
                className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
              >
                {l.label.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {post.coverImageUrl && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-100">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      <div className="mt-8">
        <PostContent html={safeHtml} />
      </div>

      {/* Comments */}
      <section className="mt-12 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-bold text-slate-900">
          Comments ({post.comments.length})
        </h2>

        <div className="mt-4 space-y-4">
          {post.comments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No comments yet. Be the first to comment.
            </p>
          ) : (
            post.comments.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">
                    {c.authorName}
                  </span>
                  <time className="text-xs text-slate-400">
                    {formatDate(c.createdAt)}
                  </time>
                </div>
                {/* Comment body was sanitized on submit (sanitizeCommentHtml). */}
                <div
                  className="mt-2 text-sm text-slate-700"
                  dangerouslySetInnerHTML={{ __html: c.body }}
                />
              </div>
            ))
          )}
        </div>

        <div className="mt-8">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">
            Leave a comment
          </h3>
          <CommentForm postId={post.id} slug={post.slug} />
        </div>
      </section>
    </article>
  );
}

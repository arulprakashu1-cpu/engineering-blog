import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { approveComment, deleteComment } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminCommentsPage() {
  const comments = await prisma.comment.findMany({
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
    include: { post: { select: { title: true, slug: true } } },
  });

  const pending = comments.filter((c) => !c.approved);
  const approved = comments.filter((c) => c.approved);

  function Row({ c }: { c: (typeof comments)[number] }) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm">
            <span className="font-medium text-slate-900">{c.authorName}</span>
            <span className="text-slate-400"> · {formatDate(c.createdAt)}</span>
          </div>
          <Link
            href={`/posts/${c.post.slug}`}
            target="_blank"
            className="text-xs text-brand-600 hover:underline"
          >
            on “{c.post.title}” ↗
          </Link>
        </div>
        <div
          className="mt-2 text-sm text-slate-700"
          dangerouslySetInnerHTML={{ __html: c.body }}
        />
        <div className="mt-3 flex items-center gap-3">
          {!c.approved && (
            <form action={approveComment}>
              <input type="hidden" name="commentId" value={c.id} />
              <button
                type="submit"
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
              >
                Approve
              </button>
            </form>
          )}
          <form action={deleteComment}>
            <input type="hidden" name="commentId" value={c.id} />
            <button
              type="submit"
              className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Comments
      </h1>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pending moderation ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing awaiting moderation.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((c) => (
              <Row key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Approved ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <p className="text-sm text-slate-400">No approved comments yet.</p>
        ) : (
          <div className="space-y-3">
            {approved.map((c) => (
              <Row key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

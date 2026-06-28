import Link from "next/link";
import { getArchive, getLabelsWithCounts } from "@/lib/posts";

/** Public sidebar: label filter list + archive-by-month list. */
export default async function Sidebar({ activeLabel }: { activeLabel?: string }) {
  const [labels, archive] = await Promise.all([
    getLabelsWithCounts(),
    getArchive(),
  ]);

  return (
    <aside className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Labels
        </h3>
        {labels.length === 0 ? (
          <p className="text-sm text-slate-400">No labels yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {labels.map((label) => (
              <li key={label.slug}>
                <Link
                  href={`/labels/${label.slug}`}
                  className={`flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-slate-100 ${
                    activeLabel === label.slug
                      ? "bg-brand-50 font-medium text-brand-700"
                      : "text-slate-700"
                  }`}
                >
                  <span>{label.name}</span>
                  <span className="text-xs text-slate-400">{label.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Archive
        </h3>
        {archive.length === 0 ? (
          <p className="text-sm text-slate-400">No posts yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {archive.map((m) => (
              <li key={m.key}>
                <Link
                  href={`/?month=${m.key}`}
                  className="flex items-center justify-between rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <span>{m.label}</span>
                  <span className="text-xs text-slate-400">{m.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}

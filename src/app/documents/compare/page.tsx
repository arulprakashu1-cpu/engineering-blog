import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import DocumentSearch from "@/components/DocumentSearch";
import {
  CATEGORY_META,
  formatBytes,
  getDocumentGroups,
  getDocumentsInGroup,
  isPdf,
} from "@/lib/documents";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Compare documents",
  description:
    "Group documents that share a name and compare their versions across Standard Documents, Lessons Learnt, and Checklists side by side.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { q?: string; group?: string };
}) {
  const search = searchParams.q?.trim() || undefined;

  // ---- Side-by-side comparison for a single name group --------------------
  if (searchParams.group) {
    const docs = await getDocumentsInGroup(searchParams.group);
    if (docs.length === 0) {
      return (
        <div className="mx-auto max-w-2xl py-16 text-center text-slate-500">
          <p>That document group no longer exists.</p>
          <Link href="/documents/compare" className="mt-4 inline-block text-brand-600 hover:underline">
            ← Back to compare
          </Link>
        </div>
      );
    }
    const name = docs[0].title;
    // Cap columns so panels stay readable; they wrap on smaller screens.
    const cols = Math.min(docs.length, 3);
    return (
      <div className="mx-auto max-w-6xl">
        <Link href="/documents/compare" className="text-sm text-brand-600 hover:text-brand-700">
          ← All groups
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Comparing: {name}
        </h1>
        <p className="mt-1 text-slate-600">
          {docs.length} version{docs.length === 1 ? "" : "s"} across categories,
          side by side.
        </p>

        <div
          className="mt-6 grid grid-cols-1 gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {docs.map((doc) => {
            const meta = CATEGORY_META[doc.category];
            const fileUrl = `/api/files/${doc.id}`;
            return (
              <div
                key={doc.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white"
              >
                <div className="border-b border-slate-200 p-3">
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {meta.label}
                  </span>
                  <h2 className="mt-1.5 truncate text-sm font-semibold text-slate-900" title={doc.title}>
                    {doc.title}
                  </h2>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span className="truncate">{doc.fileName}</span>
                    <span>·</span>
                    <span>{formatBytes(doc.fileSize)}</span>
                  </div>
                </div>

                <div className="flex-1 p-2">
                  {isPdf(doc.mimeType) ? (
                    <iframe
                      title={doc.title}
                      src={fileUrl}
                      className="h-[70vh] w-full rounded-md border border-slate-100 bg-white"
                    />
                  ) : doc.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileUrl} alt={doc.title} className="mx-auto max-h-[70vh] max-w-full rounded-md" />
                  ) : (
                    <div className="flex h-[70vh] items-center justify-center rounded-md border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                      No inline preview for this file type.
                    </div>
                  )}
                </div>

                <div className="flex gap-2 border-t border-slate-200 p-3">
                  <Link href={`/documents/${doc.id}`} className="text-xs font-medium text-brand-600 hover:underline">
                    Open
                  </Link>
                  <a href={`${fileUrl}?download=1`} className="text-xs font-medium text-brand-600 hover:underline">
                    Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- List of name groups -------------------------------------------------
  const groups = await getDocumentGroups(search);
  const comparable = groups.filter((g) => g.docs.length > 1);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/documents" className="text-sm text-brand-600 hover:text-brand-700">
        ← All documents
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        Compare by name
      </h1>
      <p className="mt-1 text-slate-600">
        Documents that share a name are grouped here. Groups that appear in more
        than one category can be compared side by side.
      </p>

      <div className="mt-5">
        <Suspense fallback={<div className="h-10" />}>
          <DocumentSearch basePath="/documents/compare" placeholder="Search document names…" />
        </Suspense>
      </div>

      {comparable.length > 0 && (
        <p className="mt-5 text-sm font-medium text-slate-500">
          {comparable.length} group{comparable.length === 1 ? "" : "s"} available
          to compare
        </p>
      )}

      <div className="mt-3 space-y-3">
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            No documents found.
          </div>
        ) : (
          groups.map((g) => {
            const multi = g.docs.length > 1;
            return (
              <div
                key={g.key}
                className={`rounded-xl border bg-white p-4 ${
                  multi ? "border-brand-200" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-slate-900">
                      {g.name}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {g.docs.map((d) => (
                        <Link
                          key={d.id}
                          href={`/documents/${d.id}`}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                          title={d.title}
                        >
                          {CATEGORY_META[d.category].label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {multi ? (
                    <Link
                      href={`/documents/compare?group=${encodeURIComponent(g.key)}`}
                      className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      ⇄ Compare {g.docs.length}
                    </Link>
                  ) : (
                    <span className="shrink-0 self-center text-xs text-slate-400">
                      single version
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

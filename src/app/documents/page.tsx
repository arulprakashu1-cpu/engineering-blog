import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import DocumentCard from "@/components/DocumentCard";
import DocumentSearch from "@/components/DocumentSearch";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  categoryFromSlug,
  getPublishedDocuments,
} from "@/lib/documents";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Documents",
  description:
    "Standard documents, lessons learnt, and checklists — search, view, download, and compare across categories.",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const activeCategory = categoryFromSlug(searchParams.category);
  const search = searchParams.q?.trim() || undefined;
  const docs = await getPublishedDocuments({ category: activeCategory, search });

  const tabs = [
    { slug: undefined as string | undefined, label: "All" },
    ...CATEGORY_ORDER.map((c) => ({
      slug: CATEGORY_META[c].slug,
      label: CATEGORY_META[c].plural,
    })),
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Documents
        </h1>
        <Link
          href="/documents/compare"
          className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          ⇄ Compare by name
        </Link>
      </div>
      <p className="mt-1 text-slate-600">
        Search, view inline (PDFs), download, or compare the same document across
        categories.
      </p>

      <div className="mt-5">
        <Suspense fallback={<div className="h-10" />}>
          <DocumentSearch />
        </Suspense>
      </div>

      {/* Category tabs (preserve the active search) */}
      <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map((tab) => {
          const sp = new URLSearchParams();
          if (tab.slug) sp.set("category", tab.slug);
          if (search) sp.set("q", search);
          const qs = sp.toString();
          const href = qs ? `/documents?${qs}` : "/documents";
          const isActive = tab.slug
            ? searchParams.category === tab.slug
            : !searchParams.category;
          return (
            <Link
              key={tab.label}
              href={href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {activeCategory && !search && (
        <p className="mt-4 text-sm text-slate-500">
          {CATEGORY_META[activeCategory].description}
        </p>
      )}
      {search && (
        <p className="mt-4 text-sm text-slate-500">
          {docs.length} result{docs.length === 1 ? "" : "s"} for “
          <span className="font-medium">{search}</span>”
        </p>
      )}

      <div className="mt-6 space-y-3">
        {docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            No documents found.
          </div>
        ) : (
          docs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
        )}
      </div>
    </div>
  );
}

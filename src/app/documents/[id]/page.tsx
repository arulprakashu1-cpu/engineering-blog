import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_META, formatBytes, getDocument, isPdf } from "@/lib/documents";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const doc = await getDocument(params.id);
  if (!doc || !doc.published) return { title: "Document not found" };
  return {
    title: doc.title,
    description: doc.description || `${CATEGORY_META[doc.category].label}`,
  };
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function DocumentViewPage({
  params,
}: {
  params: { id: string };
}) {
  const doc = await getDocument(params.id);
  // Public viewer only exposes published documents.
  if (!doc || !doc.published) notFound();

  const meta = CATEGORY_META[doc.category];
  const fileUrl = `/api/files/${doc.id}`;
  const pdf = isPdf(doc.mimeType);
  const image = doc.mimeType.startsWith("image/");

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/documents?category=${meta.slug}`}
        className="text-sm text-brand-600 hover:text-brand-700"
      >
        ← {meta.plural}
      </Link>

      <header className="mt-3">
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {meta.label}
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {doc.title}
        </h1>
        {doc.description && (
          <p className="mt-2 text-slate-600">{doc.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-slate-400">
          <span>{formatDate(doc.createdAt)}</span>
          <span>·</span>
          <span className="truncate">{doc.fileName}</span>
          <span>·</span>
          <span>{formatBytes(doc.fileSize)}</span>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Open in new tab
        </a>
        <a
          href={`${fileUrl}?download=1`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Download
        </a>
      </div>

      {/* Inline viewer */}
      <div className="mt-6">
        {pdf ? (
          <iframe
            title={doc.title}
            src={fileUrl}
            className="h-[80vh] w-full rounded-lg border border-slate-200 bg-white"
          />
        ) : image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl}
            alt={doc.title}
            className="mx-auto max-w-full rounded-lg border border-slate-200"
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            This file type can’t be previewed in the browser. Use{" "}
            <span className="font-medium">Download</span> to view it.
          </div>
        )}
      </div>
    </div>
  );
}

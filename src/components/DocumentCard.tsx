import Link from "next/link";
import { CATEGORY_META, formatBytes, isPdf, type DocumentMeta } from "@/lib/documents";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function FileGlyph({ mimeType }: { mimeType: string }) {
  const label = isPdf(mimeType)
    ? "PDF"
    : mimeType.startsWith("image/")
      ? "IMG"
      : "FILE";
  const color = isPdf(mimeType)
    ? "bg-red-100 text-red-700"
    : mimeType.startsWith("image/")
      ? "bg-violet-100 text-violet-700"
      : "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-[10px] font-bold ${color}`}>
      {label}
    </span>
  );
}

export default function DocumentCard({ doc }: { doc: DocumentMeta }) {
  const meta = CATEGORY_META[doc.category];
  return (
    <article className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <FileGlyph mimeType={doc.mimeType} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {meta.label}
          </span>
          {!doc.published && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Draft
            </span>
          )}
        </div>

        <h3 className="mt-1.5 truncate text-base font-semibold text-slate-900">
          <Link href={`/documents/${doc.id}`} className="hover:text-brand-600">
            {doc.title}
          </Link>
        </h3>

        {doc.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {doc.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <span>{formatDate(doc.createdAt)}</span>
          <span>·</span>
          <span>{formatBytes(doc.fileSize)}</span>
          <span>·</span>
          <Link href={`/documents/${doc.id}`} className="font-medium text-brand-600 hover:underline">
            View
          </Link>
          <a
            href={`/api/files/${doc.id}?download=1`}
            className="font-medium text-brand-600 hover:underline"
          >
            Download
          </a>
        </div>
      </div>
    </article>
  );
}

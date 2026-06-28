import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META, formatBytes, documentMetaSelect } from "@/lib/documents";
import DeleteDocumentButton from "@/components/DeleteDocumentButton";
import ToggleDocumentPublishButton from "@/components/ToggleDocumentPublishButton";
import DocumentSearch from "@/components/DocumentSearch";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: { uploaded?: string; deleted?: string; q?: string };
}) {
  const search = searchParams.q?.trim() || undefined;
  const docs = await prisma.document.findMany({
    where: search
      ? { title: { contains: search, mode: "insensitive" } }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: documentMetaSelect,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Documents{" "}
          <span className="text-base font-normal text-slate-400">({docs.length})</span>
        </h1>
        <Link
          href="/admin/documents/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Upload document
        </Link>
      </div>

      <div className="mb-4 max-w-md">
        <Suspense fallback={<div className="h-10" />}>
          <DocumentSearch basePath="/admin/documents" />
        </Suspense>
      </div>

      {searchParams.uploaded && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Document uploaded.
        </div>
      )}
      {searchParams.deleted && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Document deleted.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {docs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No documents yet.{" "}
                  <Link href="/admin/documents/new" className="text-brand-600 hover:underline">
                    Upload one
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {doc.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {CATEGORY_META[doc.category].label}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <span className="block max-w-[180px] truncate">{doc.fileName}</span>
                    <span className="text-xs text-slate-400">
                      {formatBytes(doc.fileSize)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {doc.published ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/documents/${doc.id}`}
                        target="_blank"
                        className="text-sm font-medium text-slate-600 hover:text-brand-600"
                      >
                        View
                      </Link>
                      <ToggleDocumentPublishButton
                        documentId={doc.id}
                        published={doc.published}
                      />
                      <DeleteDocumentButton documentId={doc.id} title={doc.title} />
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

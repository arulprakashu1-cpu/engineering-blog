"use client";

import { useState } from "react";
import { deleteDocument } from "@/app/actions/documents";

/** Two-step delete with an "are you sure?" confirmation dialog. */
export default function DeleteDocumentButton({
  documentId,
  title,
}: {
  documentId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 hover:text-red-700"
      >
        Delete
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900">
              Delete document?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This permanently deletes{" "}
              <span className="font-medium text-slate-900">“{title}”</span> and
              removes the file from disk. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <form action={deleteDocument}>
                <input type="hidden" name="documentId" value={documentId} />
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Yes, delete
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

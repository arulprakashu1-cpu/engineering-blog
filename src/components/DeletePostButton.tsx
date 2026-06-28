"use client";

import { useState } from "react";
import { deletePost } from "@/app/actions/admin";

/**
 * Two-step delete: clicking opens a confirmation dialog ("Are you sure?").
 * Only the confirm button actually submits the deletePost Server Action.
 * `compact` renders a small inline link for the admin table.
 */
export default function DeletePostButton({
  postId,
  title,
  compact = false,
}: {
  postId: string;
  title: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "text-sm font-medium text-red-600 hover:text-red-700"
            : "rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        }
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
            <h3 className="text-lg font-semibold text-slate-900">Delete post?</h3>
            <p className="mt-2 text-sm text-slate-600">
              You are about to permanently delete{" "}
              <span className="font-medium text-slate-900">“{title}”</span> and
              its comments. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <form action={deletePost}>
                <input type="hidden" name="postId" value={postId} />
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

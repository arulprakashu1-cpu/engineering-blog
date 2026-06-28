"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef } from "react";
import { submitComment, type CommentState } from "@/app/actions/public";

const initialState: CommentState = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Submitting…" : "Post comment"}
    </button>
  );
}

export default function CommentForm({
  postId,
  slug,
}: {
  postId: string;
  slug: string;
}) {
  const [state, formAction] = useFormState(submitComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />

      {/* Honeypot: visually hidden, off-screen. Bots fill it; humans don't. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="authorName" className="mb-1 block text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="authorName"
          name="authorName"
          required
          maxLength={80}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label htmlFor="body" className="mb-1 block text-sm font-medium text-slate-700">
          Comment
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          maxLength={4000}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-slate-400">
          Basic formatting allowed: bold, italic, code, links. Comments appear
          after moderation.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton />
        {state.message && (
          <span
            className={`text-sm ${state.ok ? "text-green-600" : "text-red-600"}`}
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}

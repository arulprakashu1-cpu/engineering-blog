"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { uploadDocument, type DocActionState } from "@/app/actions/documents";

const initialState: DocActionState = { ok: false, message: "" };

const CATEGORIES = [
  { value: "STANDARD_DOCUMENT", label: "Standard Document" },
  { value: "LESSON_LEARNT", label: "Lesson Learnt" },
  { value: "CHECKLIST", label: "Checklist" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Uploading…" : "Upload document"}
    </button>
  );
}

export default function DocumentUploadForm() {
  const [state, formAction] = useFormState(uploadDocument, initialState);
  const [published, setPublished] = useState(true);
  const [fileName, setFileName] = useState("");

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <input type="hidden" name="published" value={published ? "true" : "false"} />

      {state.message && !state.ok && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
        <input
          name="title"
          required
          maxLength={200}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Category
        </label>
        <select
          name="category"
          required
          defaultValue="STANDARD_DOCUMENT"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Description <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          name="description"
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          File <span className="font-normal text-slate-400">(PDF or any file, max 25 MB)</span>
        </label>
        <input
          type="file"
          name="file"
          required
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
        />
        {fileName && (
          <p className="mt-1 text-xs text-slate-500">Selected: {fileName}</p>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          id="published"
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="published" className="text-sm font-medium text-slate-700">
          Published{" "}
          <span className="font-normal text-slate-400">
            (uncheck to keep private/draft)
          </span>
        </label>
      </div>

      <SubmitButton />
    </form>
  );
}

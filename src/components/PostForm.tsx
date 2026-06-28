"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { useMemo, useState } from "react";
import LivePreview from "@/components/LivePreview";
import DeletePostButton from "@/components/DeletePostButton";
import { slugify } from "@/lib/slugify";
import type { ActionState } from "@/app/actions/admin";

// CodeMirror touches the DOM, so load it client-only.
const HtmlEditor = dynamic(() => import("@/components/HtmlEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-lg border border-slate-300 text-sm text-slate-400">
      Loading editor…
    </div>
  ),
});

export type PostFormData = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImageUrl: string;
  published: boolean;
  labels: string[];
};

const initialState: ActionState = { ok: false, message: "" };

function SaveButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create post"}
    </button>
  );
}

export default function PostForm({
  initial,
  allLabels,
  action,
  flashMessage,
}: {
  initial: PostFormData;
  allLabels: { name: string; slug: string }[];
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  flashMessage?: string;
}) {
  const isEdit = Boolean(initial.id);
  const [state, formAction] = useFormState(action, initialState);

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.slug));
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [coverImageUrl, setCoverImageUrl] = useState(initial.coverImageUrl);
  const [contentHtml, setContentHtml] = useState(initial.contentHtml);
  const [published, setPublished] = useState(initial.published);
  const [labels, setLabels] = useState<string[]>(initial.labels);
  const [newLabel, setNewLabel] = useState("");

  // Auto-suggest the slug from the title until the user edits it manually.
  const effectiveSlug = useMemo(() => {
    if (slugEdited) return slug;
    return slugify(title);
  }, [slug, slugEdited, title]);

  const existingLabelNames = useMemo(
    () => allLabels.map((l) => l.name),
    [allLabels],
  );

  function toggleLabel(name: string) {
    setLabels((prev) =>
      prev.some((l) => l.toLowerCase() === name.toLowerCase())
        ? prev.filter((l) => l.toLowerCase() !== name.toLowerCase())
        : [...prev, name],
    );
  }

  function addNewLabel() {
    const t = newLabel.trim();
    if (!t) return;
    if (!labels.some((l) => l.toLowerCase() === t.toLowerCase())) {
      setLabels((prev) => [...prev, t]);
    }
    setNewLabel("");
  }

  const unselectedExisting = existingLabelNames.filter(
    (n) => !labels.some((l) => l.toLowerCase() === n.toLowerCase()),
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden fields carry React-controlled values into the Server Action. */}
      <input type="hidden" name="slug" value={effectiveSlug} />
      <input type="hidden" name="contentHtml" value={contentHtml} />
      <input type="hidden" name="published" value={published ? "true" : "false"} />
      <input type="hidden" name="labels" value={JSON.stringify(labels)} />

      {(flashMessage || state.message) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.ok || flashMessage
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message || flashMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column: metadata */}
        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Slug{" "}
              <span className="font-normal text-slate-400">
                (auto from title, editable)
              </span>
            </label>
            <input
              value={effectiveSlug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEdited(true);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-slate-400">/posts/{effectiveSlug || "…"}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Excerpt
            </label>
            <textarea
              name="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Cover image URL
            </label>
            <input
              name="coverImageUrl"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Labels */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Labels
            </label>
            {labels.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {labels.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                  >
                    {l}
                    <button
                      type="button"
                      onClick={() => toggleLabel(l)}
                      className="text-brand-400 hover:text-brand-700"
                      aria-label={`Remove ${l}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {unselectedExisting.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {unselectedExisting.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleLabel(n)}
                    className="rounded-full border border-slate-300 px-2.5 py-0.5 text-xs text-slate-600 hover:border-brand-400 hover:text-brand-700"
                  >
                    + {n}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNewLabel();
                  }
                }}
                placeholder="Create a new label…"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={addNewLabel}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
              >
                Add
              </button>
            </div>
          </div>

          {/* Publish toggle */}
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
                (uncheck to keep as draft)
              </span>
            </label>
          </div>
        </div>

        {/* Right column: editor + preview */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Content (raw HTML — embedded widgets/scripts allowed)
            </label>
            <HtmlEditor value={contentHtml} onChange={setContentHtml} />
          </div>
        </div>
      </div>

      {/* Full-width live preview */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">
            Live preview
          </label>
          <span className="text-xs text-slate-400">
            Sandboxed iframe · widget scripts run here
          </span>
        </div>
        <LivePreview html={contentHtml} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
        <div className="flex items-center gap-3">
          <SaveButton isEdit={isEdit} />
          <Link
            href="/admin/posts"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </Link>
          {isEdit && effectiveSlug && (
            <Link
              href={`/posts/${effectiveSlug}`}
              target="_blank"
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              View ↗
            </Link>
          )}
        </div>

        {isEdit && initial.id && (
          <DeletePostButton postId={initial.id} title={initial.title} />
        )}
      </div>
    </form>
  );
}

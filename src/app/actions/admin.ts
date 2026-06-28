"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export type ActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string> };

const postSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.string().trim().max(200).optional(),
  excerpt: z.string().trim().max(500).optional(),
  contentHtml: z.string().max(500_000).optional(),
  coverImageUrl: z
    .string()
    .trim()
    .url("Cover image must be a valid URL")
    .optional()
    .or(z.literal("")),
  published: z.boolean(),
  labels: z.array(z.string().trim().min(1)).max(50),
});

function parseLabels(raw: FormDataEntryValue | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // De-dupe by name (case-insensitive), keep first spelling.
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of arr) {
      if (typeof v !== "string") continue;
      const t = v.trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  } catch {
    return [];
  }
}

/** Generate a slug unique across posts, optionally ignoring one post id. */
async function ensureUniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || "post";
  let candidate = root;
  let n = 1;
  // Loop until no other post owns the candidate slug.
  // (Small number of iterations in practice.)
  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === ignoreId) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

/** Upsert labels by name and return their ids. */
async function resolveLabelIds(names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    const label = await prisma.label.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) || name.toLowerCase() },
    });
    ids.push(label.id);
  }
  return ids;
}

function readForm(formData: FormData) {
  return {
    title: (formData.get("title") as string) ?? "",
    slug: (formData.get("slug") as string) ?? "",
    excerpt: (formData.get("excerpt") as string) ?? "",
    contentHtml: (formData.get("contentHtml") as string) ?? "",
    coverImageUrl: (formData.get("coverImageUrl") as string) ?? "",
    published: formData.get("published") === "on" || formData.get("published") === "true",
    labels: parseLabels(formData.get("labels")),
  };
}

export async function createPost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = postSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const data = parsed.data;

  const slug = await ensureUniqueSlug(data.slug || data.title);
  const labelIds = await resolveLabelIds(data.labels);

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt ?? "",
      contentHtml: data.contentHtml ?? "",
      coverImageUrl: data.coverImageUrl || null,
      published: data.published,
      labels: { create: labelIds.map((labelId) => ({ labelId })) },
    },
  });

  // On-demand revalidation so the new post is live immediately.
  revalidatePath("/");
  revalidatePath(`/posts/${slug}`);
  revalidatePath("/admin/posts");

  redirect(`/admin/posts/${post.id}/edit?created=1`);
}

export async function updatePost(
  postId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = postSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const data = parsed.data;

  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) return { ok: false, message: "Post not found." };

  const slug = await ensureUniqueSlug(data.slug || data.title, postId);
  const labelIds = await resolveLabelIds(data.labels);

  await prisma.$transaction([
    prisma.postLabel.deleteMany({ where: { postId } }),
    prisma.post.update({
      where: { id: postId },
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt ?? "",
        contentHtml: data.contentHtml ?? "",
        coverImageUrl: data.coverImageUrl || null,
        published: data.published,
        labels: { create: labelIds.map((labelId) => ({ labelId })) },
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath(`/posts/${slug}`);
  if (existing.slug !== slug) revalidatePath(`/posts/${existing.slug}`);
  revalidatePath("/admin/posts");

  return { ok: true, message: "Saved." };
}

export async function deletePost(formData: FormData): Promise<void> {
  await requireAdmin();
  const postId = formData.get("postId") as string;
  if (!postId) return;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { slug: true },
  });

  await prisma.post.delete({ where: { id: postId } });

  revalidatePath("/");
  if (post) revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/admin/posts");
  redirect("/admin/posts?deleted=1");
}

export async function togglePublish(formData: FormData): Promise<void> {
  await requireAdmin();
  const postId = formData.get("postId") as string;
  if (!postId) return;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return;

  await prisma.post.update({
    where: { id: postId },
    data: { published: !post.published },
  });

  revalidatePath("/");
  revalidatePath(`/posts/${post.slug}`);
  revalidatePath("/admin/posts");
}

// --------------------------- Comment moderation ---------------------------

export async function approveComment(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("commentId") as string;
  if (!id) return;

  const comment = await prisma.comment.update({
    where: { id },
    data: { approved: true },
    include: { post: { select: { slug: true } } },
  });

  revalidatePath("/admin/comments");
  revalidatePath(`/posts/${comment.post.slug}`);
}

export async function deleteComment(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("commentId") as string;
  if (!id) return;

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { post: { select: { slug: true } } },
  });
  if (!comment) return;

  await prisma.comment.delete({ where: { id } });

  revalidatePath("/admin/comments");
  revalidatePath(`/posts/${comment.post.slug}`);
}

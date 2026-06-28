"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/ratelimit";
import { sanitizeCommentHtml } from "@/lib/sanitize";

const commentSchema = z.object({
  postId: z.string().min(1),
  slug: z.string().min(1),
  authorName: z.string().trim().min(1, "Name is required").max(80),
  body: z.string().trim().min(2, "Comment is too short").max(4000),
  // Honeypot field — bots fill it, humans don't.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type CommentState = { ok: boolean; message: string };

/**
 * Public comment submission. Rate-limited by IP, honeypot-protected, body
 * sanitized, and saved as UNAPPROVED so it only appears after admin moderation.
 */
export async function submitComment(
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const parsed = commentSchema.safeParse({
    postId: formData.get("postId"),
    slug: formData.get("slug"),
    authorName: formData.get("authorName"),
    body: formData.get("body"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { ok: false, message: first };
  }

  const data = parsed.data;

  // Honeypot tripped — pretend success so bots don't learn.
  if (data.website && data.website.length > 0) {
    return { ok: true, message: "Thanks! Your comment is awaiting moderation." };
  }

  // IP-based throttle: max 3 comments per 5 minutes.
  const ip =
    headers().get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers().get("x-real-ip") ||
    "unknown";
  const limited = rateLimit(`comment:${ip}`, {
    limit: 3,
    windowMs: 5 * 60 * 1000,
  });
  if (!limited.ok) {
    return {
      ok: false,
      message: "You're commenting too quickly. Please try again later.",
    };
  }

  // Ensure the post exists and is published before accepting a comment.
  const post = await prisma.post.findFirst({
    where: { id: data.postId, published: true },
    select: { id: true },
  });
  if (!post) {
    return { ok: false, message: "Post not found." };
  }

  await prisma.comment.create({
    data: {
      postId: post.id,
      authorName: data.authorName,
      body: sanitizeCommentHtml(data.body),
      approved: false,
    },
  });

  revalidatePath(`/posts/${data.slug}`);
  return {
    ok: true,
    message: "Thanks! Your comment is awaiting moderation.",
  };
}

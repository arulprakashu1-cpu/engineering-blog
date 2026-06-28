"use server";

import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export type DocActionState = { ok: boolean; message: string };

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

// Extensions we refuse even though "any file" is allowed — these are either
// executable or can carry active content that would be unsafe to serve inline.
const BLOCKED_EXT = new Set([
  ".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".dll", ".jar",
  ".js", ".mjs", ".cjs", ".vbs", ".ps1", ".sh", ".php", ".html", ".htm",
  ".svg", ".xhtml",
]);

const metaSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(1000).optional(),
  category: z.enum(["STANDARD_DOCUMENT", "LESSON_LEARNT", "CHECKLIST"]),
  published: z.boolean(),
});

export async function uploadDocument(
  _prev: DocActionState,
  formData: FormData,
): Promise<DocActionState> {
  await requireAdmin();

  const parsed = metaSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    category: formData.get("category"),
    published: formData.get("published") === "true",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Please choose a file to upload." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "File is too large (max 25 MB)." };
  }

  const ext = path.extname(file.name).toLowerCase();
  if (BLOCKED_EXT.has(ext)) {
    return {
      ok: false,
      message: `For safety, ${ext} files cannot be uploaded.`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  await prisma.document.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      category: parsed.data.category,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      fileData: buffer,
      published: parsed.data.published,
    },
  });

  revalidatePath("/documents");
  revalidatePath("/documents/compare");
  revalidatePath("/admin/documents");
  redirect("/admin/documents?uploaded=1");
}

export async function deleteDocument(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("documentId") as string;
  if (!id) return;

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!doc) return;

  await prisma.document.delete({ where: { id } });

  revalidatePath("/documents");
  revalidatePath("/documents/compare");
  revalidatePath("/admin/documents");
  redirect("/admin/documents?deleted=1");
}

export async function toggleDocumentPublish(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = formData.get("documentId") as string;
  if (!id) return;

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { id: true, published: true },
  });
  if (!doc) return;

  await prisma.document.update({
    where: { id },
    data: { published: !doc.published },
  });

  revalidatePath("/documents");
  revalidatePath("/documents/compare");
  revalidatePath("/admin/documents");
}

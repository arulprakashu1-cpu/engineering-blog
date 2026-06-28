import { Prisma, type DocumentCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** UI metadata for each document category, keyed by the Prisma enum value. */
export const CATEGORY_META: Record<
  DocumentCategory,
  { label: string; plural: string; slug: string; description: string }
> = {
  STANDARD_DOCUMENT: {
    label: "Standard Document",
    plural: "Standard Documents",
    slug: "standard",
    description: "Reference standards, specs, and controlled documents.",
  },
  LESSON_LEARNT: {
    label: "Lesson Learnt",
    plural: "Lessons Learnt",
    slug: "lessons",
    description: "Post-project notes and lessons learnt write-ups.",
  },
  CHECKLIST: {
    label: "Checklist",
    plural: "Checklists",
    slug: "checklists",
    description: "Review and process checklists.",
  },
};

export const CATEGORY_ORDER: DocumentCategory[] = [
  "STANDARD_DOCUMENT",
  "LESSON_LEARNT",
  "CHECKLIST",
];

// Every column EXCEPT the heavy `fileData` bytes. Used by all list/detail
// queries; only the /api/files route ever loads the bytes.
export const documentMetaSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  fileName: true,
  mimeType: true,
  fileSize: true,
  published: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DocumentSelect;

export type DocumentMeta = Prisma.DocumentGetPayload<{
  select: typeof documentMetaSelect;
}>;

/** Map a URL slug (e.g. "lessons") back to the Prisma enum value. */
export function categoryFromSlug(
  slug: string | undefined,
): DocumentCategory | undefined {
  if (!slug) return undefined;
  return CATEGORY_ORDER.find((c) => CATEGORY_META[c].slug === slug);
}

export function isPdf(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Normalized grouping key for a document title. Documents that normalize to the
 * same key are treated as "the same document" across categories, so a Standard
 * Document, a Lessons Learnt, and a Checklist that share a name group together.
 */
export function normalizeName(title: string): string {
  return title
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ") // drop parenthetical notes like "(Rev A)"
    .replace(/\b(rev|revision|v|version)\s*[a-z0-9.]+/g, " ") // drop rev tags
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function getPublishedDocuments(opts: {
  category?: DocumentCategory;
  search?: string;
}): Promise<DocumentMeta[]> {
  return prisma.document.findMany({
    where: {
      published: true,
      ...(opts.category ? { category: opts.category } : {}),
      ...(opts.search
        ? { title: { contains: opts.search, mode: "insensitive" } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: documentMetaSelect,
  });
}

/** Metadata for one document (no bytes). */
export async function getDocument(id: string): Promise<DocumentMeta | null> {
  return prisma.document.findUnique({
    where: { id },
    select: documentMetaSelect,
  });
}

export type DocumentGroup = {
  key: string;
  name: string; // display name (the most common/first title)
  docs: DocumentMeta[];
  categories: DocumentCategory[];
};

/**
 * Group all published documents by normalized name across categories.
 * Sorted so multi-version groups (those that exist in >1 category — the ones
 * worth comparing) come first.
 */
export async function getDocumentGroups(
  search?: string,
): Promise<DocumentGroup[]> {
  const docs = await prisma.document.findMany({
    where: {
      published: true,
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: documentMetaSelect,
  });

  const map = new Map<string, DocumentGroup>();
  for (const doc of docs) {
    const key = normalizeName(doc.title) || doc.title.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.docs.push(doc);
      if (!existing.categories.includes(doc.category)) {
        existing.categories.push(doc.category);
      }
    } else {
      map.set(key, {
        key,
        name: doc.title,
        docs: [doc],
        categories: [doc.category],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    // Groups spanning more categories first, then more docs, then name.
    if (b.categories.length !== a.categories.length) {
      return b.categories.length - a.categories.length;
    }
    if (b.docs.length !== a.docs.length) return b.docs.length - a.docs.length;
    return a.name.localeCompare(b.name);
  });
}

/** Published documents belonging to one normalized-name group, for comparison. */
export async function getDocumentsInGroup(
  key: string,
): Promise<DocumentMeta[]> {
  const docs = await prisma.document.findMany({
    where: { published: true },
    orderBy: { category: "asc" },
    select: documentMetaSelect,
  });
  return docs.filter(
    (d) => (normalizeName(d.title) || d.title.toLowerCase()) === key,
  );
}

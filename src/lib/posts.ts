import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "@/lib/site";

export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  createdAt: Date;
  published: boolean;
  labels: { name: string; slug: string }[];
};

function mapLabels(labels: { label: { name: string; slug: string } }[]) {
  return labels.map((l) => ({ name: l.label.name, slug: l.label.slug }));
}

/**
 * Paginated list of PUBLISHED posts, optionally filtered by title search and
 * label slug. Returns items + total count for pagination.
 */
export async function getPublishedPosts(opts: {
  page?: number;
  search?: string;
  labelSlug?: string;
  month?: string; // "YYYY-MM"
}): Promise<{ posts: PostListItem[]; total: number; pageSize: number }> {
  const page = Math.max(1, opts.page ?? 1);

  // Build an optional createdAt range from a "YYYY-MM" archive bucket.
  let dateFilter: { gte: Date; lt: Date } | undefined;
  if (opts.month && /^\d{4}-\d{2}$/.test(opts.month)) {
    const [y, m] = opts.month.split("-").map(Number);
    dateFilter = {
      gte: new Date(y, m - 1, 1),
      lt: new Date(y, m, 1),
    };
  }

  const where = {
    published: true,
    ...(opts.search
      ? { title: { contains: opts.search, mode: "insensitive" as const } }
      : {}),
    ...(opts.labelSlug
      ? { labels: { some: { label: { slug: opts.labelSlug } } } }
      : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { labels: { include: { label: true } } },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: rows.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      coverImageUrl: p.coverImageUrl,
      createdAt: p.createdAt,
      published: p.published,
      labels: mapLabels(p.labels),
    })),
    total,
    pageSize: PAGE_SIZE,
  };
}

/** Single published post by slug, with labels and approved comments. */
export async function getPublishedPostBySlug(slug: string) {
  const post = await prisma.post.findFirst({
    where: { slug, published: true },
    include: {
      labels: { include: { label: true } },
      comments: {
        where: { approved: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return post;
}

/** All labels with their published-post counts, for the sidebar. */
export async function getLabelsWithCounts() {
  const labels = await prisma.label.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { posts: { where: { post: { published: true } } } },
      },
    },
  });
  return labels
    .map((l) => ({ name: l.name, slug: l.slug, count: l._count.posts }))
    .filter((l) => l.count > 0);
}

export async function getLabelBySlug(slug: string) {
  return prisma.label.findUnique({ where: { slug } });
}

/**
 * Archive grouped by year-month, counting published posts. Computed in JS
 * (portable across Postgres configs) from the createdAt timestamps.
 */
export async function getArchive() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const buckets = new Map<string, { label: string; count: number }>();
  for (const p of posts) {
    const d = p.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    const existing = buckets.get(key);
    if (existing) existing.count += 1;
    else buckets.set(key, { label, count: 1 });
  }

  return Array.from(buckets.entries()).map(([key, v]) => ({
    key,
    label: v.label,
    count: v.count,
  }));
}

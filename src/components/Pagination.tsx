import Link from "next/link";

/**
 * Pagination that preserves existing query params (search, label, month).
 * `baseParams` is the current URLSearchParams minus the page key.
 */
export default function Pagination({
  page,
  total,
  pageSize,
  baseParams,
  basePath = "/",
}: {
  page: number;
  total: number;
  pageSize: number;
  baseParams: URLSearchParams;
  basePath?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function href(p: number) {
    const params = new URLSearchParams(baseParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-2 text-sm">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
        >
          ← Prev
        </Link>
      ) : (
        <span className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-300">
          ← Prev
        </span>
      )}

      <span className="px-2 text-slate-500">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
        >
          Next →
        </Link>
      ) : (
        <span className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-300">
          Next →
        </span>
      )}
    </nav>
  );
}

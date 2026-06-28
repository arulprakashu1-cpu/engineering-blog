import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

// Server-side guard for ALL authenticated admin pages. Even though middleware
// already gates /admin, we re-check here so the guard does not depend on edge
// config alone. (The login page lives outside this route group.)
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <span className="text-slate-400">Admin</span>
          <Link href="/admin/posts" className="text-slate-700 hover:text-brand-600">
            Posts
          </Link>
          <Link href="/admin/posts/new" className="text-slate-700 hover:text-brand-600">
            New post
          </Link>
          <Link href="/admin/documents" className="text-slate-700 hover:text-brand-600">
            Documents
          </Link>
          <Link href="/admin/comments" className="text-slate-700 hover:text-brand-600">
            Comments
          </Link>
          <Link href="/" className="text-slate-700 hover:text-brand-600">
            View site ↗
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{session.user.email}</span>
          <SignOutButton />
        </div>
      </div>
      {children}
    </div>
  );
}

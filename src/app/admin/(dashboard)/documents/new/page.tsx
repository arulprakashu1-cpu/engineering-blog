import Link from "next/link";
import DocumentUploadForm from "@/components/DocumentUploadForm";

export const dynamic = "force-dynamic";

export default function NewDocumentPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/documents" className="text-sm text-brand-600 hover:text-brand-700">
          ← Documents
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Upload document
        </h1>
      </div>
      <DocumentUploadForm />
    </div>
  );
}

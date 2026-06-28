import { toggleDocumentPublish } from "@/app/actions/documents";

/** Inline form button that flips a document's published state. */
export default function ToggleDocumentPublishButton({
  documentId,
  published,
}: {
  documentId: string;
  published: boolean;
}) {
  return (
    <form action={toggleDocumentPublish}>
      <input type="hidden" name="documentId" value={documentId} />
      <button
        type="submit"
        className={
          published
            ? "text-sm font-medium text-amber-600 hover:text-amber-700"
            : "text-sm font-medium text-green-600 hover:text-green-700"
        }
      >
        {published ? "Unpublish" : "Publish"}
      </button>
    </form>
  );
}

import { togglePublish } from "@/app/actions/admin";

/** Inline form button that flips a post's published state. */
export default function TogglePublishButton({
  postId,
  published,
}: {
  postId: string;
  published: boolean;
}) {
  return (
    <form action={togglePublish}>
      <input type="hidden" name="postId" value={postId} />
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

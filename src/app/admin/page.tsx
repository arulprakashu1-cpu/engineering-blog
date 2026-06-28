import { redirect } from "next/navigation";

// /admin is just an entry point; send admins to the posts dashboard.
export default function AdminIndex() {
  redirect("/admin/posts");
}

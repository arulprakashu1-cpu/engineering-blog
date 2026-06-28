// Protects every /admin route (except the login page) at the edge.
// Server components and Server Actions ALSO re-check the session via
// requireAdmin()/getSession() — this middleware is the first line, not the
// only line.
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
});

export const config = {
  // Match all /admin paths except /admin/login.
  matcher: ["/admin/((?!login).*)"],
};

// Centralized site configuration / metadata.
export const siteConfig = {
  name: "Engineering Notes",
  description:
    "A technical blog on electronics, embedded systems, and signal processing — with interactive calculators and simulators.",
  author: "The Engineering Blog",
  // Resolution order: explicit public URL -> NextAuth URL -> localhost.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000",
};

export const PAGE_SIZE = 6;

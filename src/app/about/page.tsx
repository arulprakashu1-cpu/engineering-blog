import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.author} and ${siteConfig.name}.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">About</h1>
      <div className="prose mt-6">
        <p>
          <strong>{siteConfig.name}</strong> is a technical blog covering
          electronics, embedded systems, and signal processing. Posts mix
          written explanation with interactive, hand-built widgets —
          calculators, simulators, and visualizers embedded directly in the
          article body.
        </p>
        <p>
          This site is a modern replacement for an older Blogger/Blogspot blog.
          It is built with Next.js (App Router), PostgreSQL via Prisma, and
          NextAuth for a single admin account. Content is authored in raw HTML
          so interactive widgets work exactly as intended, then sanitized
          server-side before rendering.
        </p>
        <h2>Contact</h2>
        <p>
          Replace this section with your real author bio, contact links, and
          social profiles. Edit{" "}
          <code>src/app/about/page.tsx</code> to customize.
        </p>
      </div>
    </div>
  );
}

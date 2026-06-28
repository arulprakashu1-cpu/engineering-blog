"use client";

import { useEffect, useRef } from "react";

/**
 * Renders sanitized post HTML AND makes embedded widget <script> tags run.
 *
 * Why this exists: React's dangerouslySetInnerHTML (and the browser's
 * innerHTML in general) inserts <script> elements but does NOT execute them.
 * For a blog whose posts contain interactive calculators/simulators written
 * as inline JS, we have to re-create each script node so the browser runs it.
 *
 * Security: `html` MUST already be sanitized by sanitizePostHtml() on the
 * server. This component does NOT sanitize — it only renders + activates
 * scripts that the trusted-admin pipeline already approved.
 *
 * Alternative (multi-author / fully-untrusted): instead of re-running scripts
 * in the page, render the body inside <iframe sandbox="allow-scripts"> via
 * srcdoc so widget JS is isolated from cookies/session. We don't do that here
 * because this is a single trusted author and in-page rendering keeps the
 * content selectable, styleable, and SEO-visible.
 */
export default function PostContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // Replace each inert <script> with a fresh, executable one.
    const scripts = Array.from(container.querySelectorAll("script"));
    for (const old of scripts) {
      const next = document.createElement("script");
      // Copy attributes (src, type, etc.).
      for (const attr of Array.from(old.attributes)) {
        next.setAttribute(attr.name, attr.value);
      }
      next.textContent = old.textContent;
      old.replaceWith(next);
    }
    // Re-running on html change is handled by the dependency below.
  }, [html]);

  return (
    <div
      ref={ref}
      className="prose"
      // html is server-sanitized via sanitizePostHtml(); see src/lib/sanitize.ts
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

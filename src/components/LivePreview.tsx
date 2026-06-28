"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Live preview of post HTML, rendered inside a sandboxed iframe.
 *
 * Why an iframe with sandbox="allow-scripts" (and NOT allow-same-origin):
 *  - Embedded widget scripts run, so the author sees the real thing.
 *  - The iframe is a separate, origin-less context: its scripts cannot touch
 *    the admin's cookies, session, or the parent DOM. This keeps the preview
 *    safe even before the content is server-sanitized on save.
 *  - Replacing srcdoc on each (debounced) change fully resets all scripts, so
 *    repeated edits don't stack duplicate event listeners.
 */
export default function LivePreview({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [debounced, setDebounced] = useState(html);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(html), 350);
    return () => clearTimeout(t);
  }, [html]);

  const srcDoc = useMemo(
    () => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
             color: #1e293b; padding: 16px; line-height: 1.6; }
      img { max-width: 100%; height: auto; }
      table { border-collapse: collapse; }
      th, td { border: 1px solid #e2e8f0; padding: 6px 10px; }
      pre { background:#0f172a; color:#e2e8f0; padding:12px; border-radius:8px; overflow:auto; }
      code { font-family: ui-monospace, monospace; }
    </style>
  </head>
  <body>${debounced}</body>
</html>`,
    [debounced],
  );

  return (
    <iframe
      ref={iframeRef}
      title="Live preview"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className="h-[520px] w-full rounded-lg border border-slate-300 bg-white"
    />
  );
}

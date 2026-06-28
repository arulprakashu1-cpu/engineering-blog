import sanitizeHtml from "sanitize-html";

/**
 * ===========================================================================
 *  HTML SANITIZATION  —  the trickiest part of this app. Read this carefully.
 * ===========================================================================
 *
 * This blog stores *raw HTML* per post (column `Post.contentHtml`), including
 * interactive widgets — calculators, simulators, visualizers — written as
 * inline <script> + form controls directly in the post body.
 *
 * We use `sanitize-html` (a pure-JS, htmlparser2-based sanitizer). It has NO
 * jsdom dependency, which matters: jsdom-based sanitizers (e.g.
 * isomorphic-dompurify) crash on serverless/Vercel with ERR_REQUIRE_ESM from a
 * transitive dep. `sanitize-html` runs cleanly in Node server components.
 *
 * Two profiles, two trust levels:
 *
 *  1. sanitizePostHtml(...)    — POST BODIES authored by the single,
 *                                authenticated admin. TRUSTED-AUTHOR model: only
 *                                a logged-in admin can ever write this HTML
 *                                (every Server Action re-checks the session).
 *                                Because the whole point is working widgets,
 *                                this profile intentionally KEEPS <script>,
 *                                <style>, form controls, sandboxed <iframe>s,
 *                                and inline event handlers. `allowedAttributes:
 *                                false` permits all attributes on allowed tags,
 *                                and `allowVulnerableTags: true` permits the
 *                                <script>/<style> tags on purpose. An admin can
 *                                therefore run JS on the page — by design, and
 *                                acceptable for a single-author blog. For
 *                                multiple authors, render via the sandboxed
 *                                iframe approach in PostContent.tsx instead.
 *
 *  2. sanitizeCommentHtml(...) — COMMENT bodies from anonymous PUBLIC visitors.
 *                                UNTRUSTED: a tiny inline-formatting allowlist,
 *                                no scripts, no attributes beyond safe links.
 *
 * Both run SERVER-SIDE before the HTML is ever sent to a browser.
 *
 * NOTE ON EXECUTION: HTML injected via React's dangerouslySetInnerHTML does NOT
 * execute <script> tags. The widget scripts are deliberately re-executed by the
 * PostContent client component (src/components/PostContent.tsx). Sanitizing here
 * + controlled re-execution there is what makes widgets work.
 */

// Tags allowed in admin-authored post bodies. Generous on purpose: structural,
// presentational, media, tables, and interactive form/widget elements.
const POST_ALLOWED_TAGS = [
  // structure & text
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "div", "span", "section",
  "article", "header", "footer", "main", "aside", "br", "hr", "blockquote",
  "pre", "code", "kbd", "samp", "var", "figure", "figcaption", "details",
  "summary",
  // inline formatting
  "a", "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
  "abbr", "cite", "q", "time",
  // lists
  "ul", "ol", "li", "dl", "dt", "dd",
  // tables
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup",
  "col",
  // media
  "img", "picture", "source", "video", "audio", "track", "canvas", "svg",
  "path", "circle", "rect", "line", "polyline", "polygon", "g", "text",
  "defs", "lineargradient", "stop", "ellipse",
  // embeds & widgets (intentional for this app)
  "iframe", "script", "style", "noscript",
  "form", "fieldset", "legend", "label", "input", "button", "select",
  "option", "optgroup", "textarea", "output", "progress", "meter", "datalist",
];

/**
 * Sanitize an admin-authored post body. Keeps widget scripts/forms/iframes.
 * MUST only ever be called with content created by an authenticated admin.
 */
export function sanitizePostHtml(dirty: string): string {
  if (!dirty) return "";
  return sanitizeHtml(dirty, {
    allowedTags: POST_ALLOWED_TAGS,
    // Trusted author: allow ALL attributes on the allowed tags (style, class,
    // id, data-*, aria-*, inline on* handlers, SVG attrs, form attrs, etc.).
    allowedAttributes: false,
    // Explicitly permit <script>/<style> (sanitize-html flags these as
    // "vulnerable" and would otherwise drop them).
    allowVulnerableTags: true,
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    // Don't lowercase attribute names so SVG (viewBox) and friends survive.
    parser: { lowerCaseAttributeNames: false },
  });
}

/**
 * Sanitize an untrusted public comment. Text plus a few inline tags only.
 * No scripts, no attributes, no event handlers.
 */
export function sanitizeCommentHtml(dirty: string): string {
  if (!dirty) return "";
  return sanitizeHtml(dirty, {
    allowedTags: ["b", "strong", "i", "em", "u", "code", "br", "p", "a"],
    allowedAttributes: { a: ["href"] },
    allowedSchemes: ["http", "https", "mailto"],
    // Drop disallowed tags but keep their text content.
    disallowedTagsMode: "discard",
  });
}

/** Plain-text excerpt helper: strip ALL tags. Used for meta descriptions. */
export function stripAllHtml(dirty: string): string {
  if (!dirty) return "";
  return sanitizeHtml(dirty, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

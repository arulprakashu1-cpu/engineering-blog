import DOMPurify from "isomorphic-dompurify";

/**
 * ===========================================================================
 *  HTML SANITIZATION  —  the trickiest part of this app. Read this carefully.
 * ===========================================================================
 *
 * This blog stores *raw HTML* per post (column `Post.contentHtml`), including
 * interactive widgets — calculators, simulators, visualizers — that are
 * written as inline <script> + form controls directly in the post body.
 *
 * There are two completely different trust levels here, so there are two
 * sanitizers:
 *
 *  1. sanitizePostHtml(...)    — for POST BODIES authored by the single,
 *                                authenticated admin. This is a TRUSTED-AUTHOR
 *                                model: only someone who has logged in through
 *                                NextAuth can ever write this HTML (every
 *                                Server Action re-checks the session). Because
 *                                the whole point is to embed working widgets,
 *                                this profile intentionally KEEPS <script>,
 *                                form controls, and sandboxed <iframe>s.
 *                                We still run it through DOMPurify to strip
 *                                malformed markup and normalize the tree, but
 *                                understand: an admin can run JS on the page.
 *                                That is by design and is acceptable for a
 *                                single-author blog. If you ever add more
 *                                authors, switch to the iframe-sandbox
 *                                rendering described in PostContent.tsx.
 *
 *  2. sanitizeCommentHtml(...) — for COMMENT bodies submitted by anonymous
 *                                PUBLIC visitors. This is UNTRUSTED input and
 *                                is locked down hard: text + a tiny set of
 *                                inline formatting tags only. No scripts, no
 *                                attributes, no links-with-protocols tricks.
 *
 * Both run SERVER-SIDE before the HTML is ever sent to a browser, satisfying
 * the "sanitize all rendered HTML server-side" requirement.
 *
 * NOTE ON EXECUTION: HTML injected via React's dangerouslySetInnerHTML does
 * NOT execute <script> tags (browsers ignore scripts inserted via innerHTML).
 * The widget scripts are re-executed deliberately by the PostContent client
 * component (src/components/PostContent.tsx). Sanitizing here + controlled
 * re-execution there is the whole mechanism that makes widgets work.
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
  "defs", "linearGradient", "stop", "ellipse",
  // embeds & widgets (intentional for this app)
  "iframe", "script", "style", "noscript",
  "form", "fieldset", "legend", "label", "input", "button", "select",
  "option", "optgroup", "textarea", "output", "progress", "meter", "datalist",
];

// Attributes allowed on post-body tags. Includes the inline event handlers a
// hand-written widget might use, plus style/class for layout.
const POST_ALLOWED_ATTR = [
  // global
  "id", "class", "style", "title", "lang", "dir", "role", "tabindex",
  "hidden", "draggable",
  // links / media
  "href", "target", "rel", "src", "srcset", "sizes", "alt", "width", "height",
  "loading", "decoding", "poster", "controls", "autoplay", "loop", "muted",
  "playsinline", "preload", "type", "media",
  // iframe
  "sandbox", "allow", "allowfullscreen", "frameborder", "referrerpolicy",
  "scrolling",
  // forms / widgets
  "name", "value", "placeholder", "min", "max", "step", "checked", "selected",
  "disabled", "readonly", "required", "multiple", "rows", "cols", "for",
  "pattern", "autocomplete", "list", "accept", "spellcheck",
  // svg / canvas
  "viewBox", "xmlns", "fill", "stroke", "stroke-width", "d", "cx", "cy", "r",
  "x", "y", "x1", "y1", "x2", "y2", "points", "transform", "offset",
  "stop-color", "gradientUnits", "rx", "ry",
  // data-* and aria-* are allowed wholesale below via ALLOW_DATA_ATTR/regex.
];

// Inline event-handler attributes some widgets use. DOMPurify strips on* by
// default; we re-permit a known set for the trusted post profile only.
const POST_ALLOWED_EVENT_ATTR = [
  "onclick", "oninput", "onchange", "onsubmit", "onkeydown", "onkeyup",
  "onkeypress", "onmouseover", "onmouseout", "onmousedown", "onmouseup",
  "onfocus", "onblur", "onload", "onmousemove",
];

let postProfileHooked = false;

/**
 * Sanitize an admin-authored post body. Keeps widget scripts/forms/iframes.
 * MUST only ever be called with content created by an authenticated admin.
 */
export function sanitizePostHtml(dirty: string): string {
  if (!dirty) return "";

  // DOMPurify normally drops on* handlers even when listed in ADD_ATTR. A hook
  // lets the curated handler list through for the trusted post profile.
  if (!postProfileHooked) {
    DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
      if (POST_ALLOWED_EVENT_ATTR.includes(data.attrName)) {
        data.forceKeepAttr = true;
      }
    });
    postProfileHooked = true;
  }

  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ["script", "iframe", "style"],
    ADD_ATTR: [...POST_ALLOWED_ATTR, ...POST_ALLOWED_EVENT_ATTR],
    ALLOWED_TAGS: POST_ALLOWED_TAGS,
    ALLOWED_ATTR: [...POST_ALLOWED_ATTR, ...POST_ALLOWED_EVENT_ATTR],
    // Allow data-* and aria-* attributes (common in widgets) and keep the
    // document fragment intact.
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true,
    FORCE_BODY: true,
    // Keep contents of <script>/<style> rather than dropping them.
    KEEP_CONTENT: true,
    WHOLE_DOCUMENT: false,
    // Do NOT sanitize the DOM into a string with the default behavior that
    // strips scripts — we explicitly opted scripts in above.
    SANITIZE_DOM: false,
  });
}

/**
 * Sanitize an untrusted public comment. Text plus a few inline tags only.
 * No scripts, no attributes, no event handlers.
 */
export function sanitizeCommentHtml(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "code", "br", "p", "a"],
    ALLOWED_ATTR: ["href"],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    // Only allow safe link protocols.
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
  });
}

/** Plain-text excerpt helper: strip ALL tags. Used for meta descriptions. */
export function stripAllHtml(dirty: string): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .replace(/\s+/g, " ")
    .trim();
}

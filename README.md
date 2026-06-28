# Engineering Notes — a modern technical blog

A production-ready replacement for a Blogger/Blogspot technical blog. Built for
electronics / embedded-systems content where posts mix prose, tables, code, and
**interactive HTML/JS widgets** (calculators, simulators, visualizers) embedded
directly in the post body.

- **Next.js 14** (App Router, TypeScript, Server Actions)
- **PostgreSQL + Prisma**
- **NextAuth** (credentials) — single admin account, no public signup
- **Tailwind CSS**
- **CodeMirror** raw-HTML editor with a sandboxed live preview
- Server-side HTML **sanitization** (`isomorphic-dompurify`)
- SEO: per-post metadata/OG, `sitemap.xml`, `robots.txt`
- ISR + on-demand revalidation on publish/edit/delete

---

## Features

| Public                                   | Admin (`/admin`, auth-gated)              |
| ---------------------------------------- | ----------------------------------------- |
| Paginated post list with search          | Login (NextAuth credentials)              |
| Label filter + month archive sidebar     | Posts table (drafts + published)          |
| Full post view (renders embedded widgets)| Create / edit with editor + live preview  |
| Per-label pages                          | Inline label create + multi-select        |
| Approved comments + moderated comment form| Publish/draft toggle, confirmed delete    |
| About page                               | Comment moderation queue                  |
| Documents hub (PDF/file view + download) | Document upload + management               |

---

## Project structure

```
prisma/
  schema.prisma        # Post, Label, PostLabel, Admin, Comment
  seed.ts              # admin + sample posts/labels/comments
scripts/
  hash-password.ts     # generate a bcrypt hash for ADMIN_PASSWORD_HASH
src/
  app/
    page.tsx                       # "/" list + search + sidebar
    posts/[slug]/page.tsx          # full post view + comments
    labels/[slug]/page.tsx         # posts by label
    about/page.tsx
    sitemap.ts, robots.ts
    admin/
      login/page.tsx               # outside the auth-gated route group
      (dashboard)/                 # route group: guarded by layout
        layout.tsx                 # server-side session guard + nav
        posts/page.tsx             # all posts table
        posts/new/page.tsx
        posts/[id]/edit/page.tsx
        comments/page.tsx
    actions/
      admin.ts                     # createPost/updatePost/deletePost/togglePublish + comment moderation
      public.ts                    # submitComment (rate-limited)
    api/auth/[...nextauth]/route.ts
  components/          # PostCard, Sidebar, PostForm, HtmlEditor, LivePreview, PostContent, ...
  lib/
    sanitize.ts        # ★ the trickiest part — read the header comment
    auth.ts            # NextAuth options + requireAdmin()
    prisma.ts, posts.ts, slugify.ts, ratelimit.ts, site.ts
  middleware.ts        # edge gate for /admin/*
```

---

## How embedded widgets work (and stay safe)

This is the most important and subtle part of the app. Three pieces cooperate:

1. **`src/lib/sanitize.ts`** runs **server-side** before any HTML reaches a
   browser. There are two profiles:
   - `sanitizePostHtml()` — for **admin-authored post bodies**. A
     *trusted-author* model: only the authenticated admin can ever write this
     HTML (every Server Action re-checks the session). It intentionally keeps
     `<script>`, form controls, and sandboxed `<iframe>`s so widgets work, while
     still normalizing the markup tree via DOMPurify.
   - `sanitizeCommentHtml()` — for **untrusted public comments**. Locked down to
     a handful of inline tags, no attributes (except safe `href`), no scripts.

2. **`src/components/PostContent.tsx`** renders the sanitized HTML and then
   **re-executes** the embedded `<script>` tags. This is necessary because HTML
   injected via `innerHTML` / `dangerouslySetInnerHTML` does **not** run scripts;
   the component recreates each script node so the browser executes it.

3. **`src/components/LivePreview.tsx`** (admin editor) renders content inside an
   `<iframe sandbox="allow-scripts">` (no `allow-same-origin`), so widget JS runs
   in an isolated context that cannot read the admin's cookies/session — even
   before the content is saved and server-sanitized.

> **Security note / trade-off:** allowing scripts in post bodies is safe here
> because there is a *single trusted author*. If you ever add more authors, do
> **not** keep in-page script execution — switch post rendering to the same
> sandboxed-iframe approach used by the live preview (documented inline in
> `PostContent.tsx`).

All admin Server Actions call `requireAdmin()` and the `(dashboard)` layout
re-checks the session server-side, so security never depends on hidden nav alone.

---

## Documents module (Standard Documents / Lessons Learnt / Checklists)

A file-based resources hub alongside the blog:

- **Categories:** Standard Document, Lesson Learnt, Checklist (each is an
  uploaded file — PDF, Office docs, images, or any file up to **25 MB**).
- **Public:** `/documents` lists published documents with category tabs and a
  **title search**; `/documents/[id]` previews PDFs/images inline (in an
  `<iframe>`/`<img>`) with open-in-new-tab and download actions.
- **Compare:** `/documents/compare` groups documents that share a name (e.g. a
  "PCB Design" Standard Document + Lessons Learnt + Checklist) and renders the
  versions **side by side** for comparison. Grouping normalizes titles (drops
  `(Rev A)`/version tags and punctuation) — see `normalizeName()` in
  `src/lib/documents.ts`.
- **Admin:** `/admin/documents` (searchable table + publish toggle + confirmed
  delete) and `/admin/documents/new` (upload form: title, description, category,
  file, published toggle).
- **Serving:** files are streamed through `/api/files/[id]` (not static assets),
  so drafts (`published = false`) return 404 to anyone without an admin session.
  PDFs/images are sent `Content-Disposition: inline`; everything else downloads.

### Storage
File bytes are stored in Postgres as `Document.fileData` (`bytea`). This is
host-agnostic — it works identically locally and on Vercel (no ephemeral-disk
problem, no extra blob-storage account). List/table queries exclude the bytes
via an explicit `select` (`documentMetaSelect`); only `/api/files/[id]` loads
them. The upload Server Action body cap is raised to 25 MB in `next.config.mjs`
(`experimental.serverActions.bodySizeLimit`). For very large files at scale you
could move bytes to a blob store later, but DB storage keeps deployment simple.

### Sample documents
`npm run db:seed-docs` creates one sample PDF per category so the hub has
content immediately (idempotent).

**Allowed files:** any type except executable/active-content extensions
(`.exe`, `.js`, `.html`, `.svg`, …), which are blocked in
`src/app/actions/documents.ts` to keep inline serving safe.

---

## Local setup

### 1. Prerequisites
- Node.js 18.18+ (tested on 20/22)
- A PostgreSQL database (local Docker, or a free Neon/Supabase instance)

### 2. Install
```bash
npm install
```

### 3. Environment
Copy the example and fill it in:
```bash
cp .env.example .env
```
Set at least:
- `DATABASE_URL` (and `DIRECT_URL` if your provider uses a pooler)
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local
- `ADMIN_EMAIL` + `ADMIN_PASSWORD` (the seed hashes it for you), **or**
  `ADMIN_PASSWORD_HASH` (precompute with `npm run hash -- "your-password"`)

### 4. Database: migrate + seed
An initial migration ships in `prisma/migrations/0_init`, so just apply it:
```bash
npx prisma migrate deploy   # applies the bundled migration
# (or `npx prisma migrate dev` if you plan to evolve the schema locally)
npm run db:seed             # admin + sample posts/labels/comments
npm run db:seed-docs        # optional: one sample PDF per document category
```

### 5. Run
```bash
npm run dev
```
Open http://localhost:3000 and sign in at http://localhost:3000/admin/login.

Useful scripts:
```bash
npm run dev        # start dev server
npm run build      # prisma generate + next build
npm run db:studio  # Prisma Studio (browse data)
npm run db:seed    # re-run the seed (idempotent)
npm run hash -- "pw"  # print a bcrypt hash
```

---

## Production deployment (Vercel + Neon/Supabase)

1. **Create a managed Postgres** on [Neon](https://neon.tech) or
   [Supabase](https://supabase.com). Copy the connection string. On Neon, also
   grab the **direct** (non-pooled) URL for migrations.

2. **Set environment variables** (locally for the migrate step, and later in
   Vercel):
   ```
   DATABASE_URL=postgresql://…           # pooled URL for the app
   DIRECT_URL=postgresql://…             # direct URL for migrations
   NEXTAUTH_SECRET=<openssl rand -base64 32>
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   ADMIN_EMAIL=you@example.com
   ADMIN_PASSWORD_HASH=<npm run hash -- "your-password">
   ```
   Prefer `ADMIN_PASSWORD_HASH` in production so no plaintext password is stored
   anywhere.

3. **Apply migrations to the production database:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Push to GitHub, import into Vercel.** Add all the env vars above in the
   Vercel project settings, then deploy. (`npm run build` runs `prisma generate`
   automatically via the build script.)

5. **Seed the admin account once** against production — e.g. with the prod env
   loaded locally:
   ```bash
   npm run db:seed
   ```
   (Or run it as a one-off via the Vercel CLI / a temporary job. The seed is
   idempotent and upserts the admin, so it is safe to re-run.)

6. **Verify:** open `/admin/login`, sign in, then **create → edit → delete** a
   sample post. Confirm an embedded widget renders on the public post page
   before migrating real content.

### Revalidation
Public pages use ISR (`export const revalidate = 60`). On top of that, the admin
Server Actions call `revalidatePath()` for `/`, the affected `/posts/[slug]`, and
`/admin/posts` whenever a post is created, edited, published/unpublished, or
deleted — so changes go live immediately without a redeploy.

---

## Content migration from Blogger

Because posts store **raw HTML** (`Post.contentHtml`), migrating Blogger content
is mostly: export the Blogger XML, extract each post's HTML body + title +
labels, and create rows (via Prisma or the admin UI). Embedded widget markup can
be pasted straight into the CodeMirror editor — just confirm each tag/attribute
it uses is in the `sanitizePostHtml` allowlist (`src/lib/sanitize.ts`); add any
missing ones there.

---

## Security checklist

- [x] Admin password stored as a **bcrypt** hash (cost 12), never plaintext
- [x] Every mutating Server Action calls `requireAdmin()` (server-side session)
- [x] `(dashboard)` layout re-checks session server-side + edge middleware gate
- [x] All rendered HTML sanitized **server-side** (posts and comments)
- [x] Comments are unapproved by default; only approved ones render publicly
- [x] Comment form: IP rate-limit (3 / 5 min) + honeypot field
- [x] `robots.txt` disallows `/admin` and `/api/`
- [x] Document files served via a guarded route (drafts 404 for anon); upload
      blocks executable/active-content extensions; path-traversal guarded

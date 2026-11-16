You are an AI coding agent. Install and wire the npm package `@ilamanownuk/blog-kit` into THIS project, following the rules below exactly. Work step by step, and do not stop after the first working screen: finish the whole checklist.

# 0. What the package is

`@ilamanownuk/blog-kit` is a Tiptap-based rich-text blog kit (RTL/Persian by default) for React 19 / Next.js. Output is a plain HTML string. It ships:

- `@ilamanownuk/blog-kit`            -> `RichTextEditor` (client component, already has "use client"), `defaultLabels`, `defaultToolbar`, `toVideoEmbedUrl`, `normalizeLinkUrl`, `isAllowedEmbedSrc`, and types.
- `@ilamanownuk/blog-kit/renderer`   -> `RichContent` (works in Server Components; sanitizes again), `sanitizeRichText`.
- `@ilamanownuk/blog-kit/server`     -> `sanitizeRichText`, `hasRichContent`, `richTextToPlain`, `toVideoEmbedUrl`, `normalizeLinkUrl`, `isAllowedEmbedSrc`, `ALL_EMBED_PROVIDERS` (no React; usable in Next server actions and NestJS).
- `@ilamanownuk/blog-kit/styles.css` -> all CSS (unlayered, so the default look survives resets/Tailwind preflight), themed with `--bk-*` CSS variables. `styles.layered.css` is the same inside `@layer blog-kit` (use only if the project wants plain utilities to override it).

Tiptap, lucide-react and sanitize-html are dependencies of the package. Peer deps: react and react-dom >= 19.

# 1. Hard rules (never break these)

1. Do NOT install `@tiptap/*` yourself for this feature. The kit brings its own pinned Tiptap. If the project already has `@tiptap/*` only for an old blog editor that you replace, remove them at the end.
2. Do NOT sanitize only on the client. ALWAYS call `sanitizeRichText` from `@ilamanownuk/blog-kit/server` on the server before saving (server action or Nest service), and reject empty content with `hasRichContent`.
3. Do NOT render stored HTML with a raw `dangerouslySetInnerHTML`. Use `<RichContent html={...} />` from `@ilamanownuk/blog-kit/renderer`.
4. The editor is a client component: use it only inside a file with `"use client"` (or a component imported by one). Never import it into a Server Component directly.
5. `allowedEmbeds` MUST be identical in the editor, in `sanitizeRichText`, and in `RichContent`. Put the value in ONE shared constant and import it everywhere (e.g. `export const BLOG_EMBEDS = ["aparat", "youtube"] as const;`). Same for `isAllowedImageSrc`.
6. Image URLs must be `https://`. `uploadImage` and `mediaApi` must return https URLs. Anything else is dropped by the sanitizer.
7. `placeholder` and `allowedEmbeds` are read once on mount; keep them stable (module constants, not inline-created arrays that change).
8. Keep existing stored HTML working. Do NOT migrate data unless the old format is not HTML. If the old content is not HTML (Markdown, JSON), say so and ask before converting.
9. Do NOT delete or rewrite the old editor/renderer/sanitizer files until the new ones work (typecheck + build pass and the page was verified). Then replace usages and remove the dead duplicated files.
10. Style with `--bk-*` variables, `classNames` and `toolbar` props. Do not edit files inside `node_modules`, and do not copy the package's source into the project.
11. Match the project's package manager (pnpm / npm / yarn / bun), code style, path aliases and language of UI strings. Do not upgrade unrelated dependencies.
12. Do not invent API. Only use props and functions listed in section 4. If something is missing, say so in the final report instead of faking it.

# 2. Step 1: inspect the project (report findings briefly before editing)

Find and note:
- Framework and versions: `next` (App Router or Pages?), `react`, `react-dom` (must be >= 19; if lower, STOP and report), TypeScript, path alias (`@/`).
- Backend style: Next Server Actions, Route Handlers, or a separate NestJS API (check `services/`, `apps/`, monorepo workspaces).
- Where blog/post content is stored (Prisma schema, Drizzle, Mongoose, ...). Is the content column an HTML string? Where is content created/updated (actions, controllers, services)?
- Any existing rich-text editor (grep for `tiptap`, `quill`, `draft`, `ckeditor`, `lexical`, `dangerouslySetInnerHTML`, `sanitize-html`) and its renderer and sanitizer.
- Media/upload system: upload endpoint or action, storage (S3/local), is there a media library table/API with list + upload? What URL format does it return (must be https)?
- Styling: Tailwind (v3 or v4?), shadcn, CSS variables for theme, dark mode strategy (`.dark` class or other), main CSS entry file, font.
- Auth: how admin actions are protected (keep that protection on every new server action).

# 3. Step 2: do the integration

1. Install: `<pm> add @ilamanownuk/blog-kit` (use the project's package manager).
2. Styles: import `@ilamanownuk/blog-kit/styles.css` once, in the global CSS entry or root layout.
   - Tailwind v4 (`@import "tailwindcss"` in CSS): `@import "@ilamanownuk/blog-kit/styles.css";` right after the Tailwind import. (Only if you choose `styles.layered.css`: declare `@layer theme, base, blog-kit, components, utilities;` BEFORE the imports.)
   - Otherwise: `import "@ilamanownuk/blog-kit/styles.css";` in the root layout.
3. Create ONE shared constants file (e.g. `src/lib/blog/config.ts`) with `BLOG_EMBEDS` and, if the project restricts image hosts, `isAllowedBlogImageSrc(src)`.
4. Server side: in the action/service that creates and updates posts, replace any existing sanitizer with:
   ```ts
   import { sanitizeRichText, hasRichContent, richTextToPlain } from "@ilamanownuk/blog-kit/server";
   const body = sanitizeRichText(input.body, { allowedEmbeds: BLOG_EMBEDS, isAllowedImageSrc });
   if (!hasRichContent(body, { allowedEmbeds: BLOG_EMBEDS, isAllowedImageSrc })) /* return a validation error */;
   const excerpt = input.excerpt?.trim() || richTextToPlain(body).slice(0, 160);
   ```
   Keep auth/permission checks. For NestJS, do this in the service (not the controller) and keep DTO validation.
5. Editor: create (or replace) the client component that holds the form field:
   ```tsx
   "use client";
   import { RichTextEditor } from "@ilamanownuk/blog-kit";
   <RichTextEditor value={html} onChange={setHtml} allowedEmbeds={BLOG_EMBEDS} uploadImage={...} mediaApi={...} />
   ```
   If the project uses react-hook-form, wire it with `Controller` (`value={field.value}`, `onChange={field.onChange}`) and pass `invalid={!!fieldState.error}` and `id`.
6. Image adapters: connect to the project's EXISTING upload/media system. Do not create a second storage system.
   - Simple upload only: implement `uploadImage(file: File) => Promise<{ url: string; alt?: string }>` by calling the existing upload action/endpoint (build `FormData` with the file). Throw `new Error("<user-facing message>")` on failure; the message is shown in the dialog. Return an https URL (convert storage keys to public URLs if needed).
   - If the project already has a media library with list + upload: implement `mediaApi = { list({ q, page }) , upload(formData) }` as Server Actions (so secrets stay on the server) and map its records to `MediaItem` (see section 4). `list` returns `{ items, total, page, pageSize, error? }`; `upload` receives `FormData` with the file under key `file` and returns `{ items, error? }`. Provide `variants["320"]` for thumbnails if available.
   - If the project already has its own media picker UI: use `renderMediaPicker={({ onSelect, close }) => <ProjectPicker onPick={(m) => onSelect({ url: m.url, alt: m.alt ?? undefined })} onCancel={close} />}`.
   - If there is no upload system at all: skip adapters (users can paste https image URLs) and mention it in the report.
7. Rendering: replace the old renderer where posts are displayed with `<RichContent html={post.body} allowedEmbeds={BLOG_EMBEDS} isAllowedImageSrc={...} />`. Wrap with the page's article layout; do not wrap in another `prose` class unless it was already used.
8. SEO: where meta description is built from content, use `richTextToPlain(body)`; keep existing metadata logic otherwise.
9. Theme: make the editor and content match the project.
   - Map variables to the project's tokens in the global CSS, for example:
     `:root { --bk-accent: var(--primary); --bk-accent-contrast: var(--primary-foreground); --bk-fg: var(--foreground); --bk-bg: var(--background); --bk-border: var(--border); --bk-muted: var(--muted); --bk-surface: var(--card); --bk-radius: var(--radius); --bk-font: var(--font-sans); }`
     (use the project's real token names; if it uses raw hex, copy its brand color to `--bk-accent`).
   - Dark mode: if the project uses a `.dark` class, nothing more is needed (the kit supports `.dark`); if it uses another attribute, set `data-bk-theme="dark"` on `<html>` at the same time. Dialogs render into `<body>`, so the theme must be on `html`/`body`.
   - Prefer the existing look if the project already had a blog style (e.g. a `.rich` class): port its typography values into `--bk-font-size`, `--bk-line-height`, `--bk-h2-size`, `--bk-h3-size`, `--bk-block-gap`, `--bk-link`, etc. Heading/list details also have variables (all optional, defaults = the kit's look): `--bk-heading-line-height`, `--bk-h2-line-height`/`--bk-h3-line-height`/`--bk-h4-line-height`, `--bk-h{2,3,4}-margin-top`/`-margin-bottom`, `--bk-h3-weight`, `--bk-h4-weight`, `--bk-list-position` (`outside`|`inside`), `--bk-list-padding`, `--bk-list-item-gap`, `--bk-list-item-p-display` (`block`|`inline`). Then delete the old content styles.
   - Use `classNames` and `toolbar` only if the project needs them.
10. Cleanup (only after everything works): remove the old editor component, old renderer, duplicated sanitizer/embed helpers and unused dependencies (`@tiptap/*`, `sanitize-html` if no longer used elsewhere). Keep anything still imported somewhere (grep first). Update tests that imported removed files, or port them.

# 4. API reference (complete)

```ts
// "@ilamanownuk/blog-kit"  (client)
function RichTextEditor(props: {
  value: string;                          // HTML
  onChange: (html: string) => void;       // empty editor => ""
  placeholder?: string;
  invalid?: boolean;                      // red border
  id?: string;                            // id of the editable area (for <label htmlFor>)
  className?: string;                     // extra class on root
  classNames?: Partial<Record<"root"|"toolbar"|"separator"|"button"|"content"|"tableTools"|"popover"|"dialog"|"input"|"label", string>>;
  toolbar?: readonly ToolbarItem[];       // order + visibility; "|" = separator; default = defaultToolbar
  uploadImage?: (file: File) => Promise<{ url: string; alt?: string }>;   // enables Upload button; throw Error(message) to show it
  mediaApi?: MediaApi;                    // built-in media library dialog
  renderMediaPicker?: (p: { onSelect: (img: { url: string; alt?: string }) => void; close: () => void }) => ReactNode; // takes precedence over mediaApi
  resolveImageSrc?: (url: string) => string;   // map URL before insertion (must still be https)
  allowedEmbeds?: readonly ("aparat" | "youtube")[];   // default both; MUST equal server option
  labels?: Partial<Labels>;               // UI strings (Persian defaults); keys = keys of `defaultLabels`
  dir?: "rtl" | "ltr";                    // default "rtl"
}): JSX.Element;

type ToolbarItem = "bold"|"italic"|"underline"|"strike"|"textColor"|"highlight"|"h2"|"h3"|"h4"
  |"right"|"center"|"left"|"justify"|"bullet"|"ordered"|"quote"|"code"|"hr"
  |"link"|"unlink"|"image"|"video"|"table"|"undo"|"redo"|"|";

type MediaApi = {
  list: (p: { q?: string; page?: number }) => Promise<{ items: MediaItem[]; total: number; page: number; pageSize: number; error?: string }>;
  upload: (formData: FormData) => Promise<{ items: MediaItem[]; error?: string }>;   // file under key "file"
};
type MediaItem = {
  id: string; url: string; originalName: string; mimeType: string; sizeBytes: number;
  width: number; height: number; alt: string | null;
  variants: Record<string, { url: string; width: number; height: number }>;   // "320" used for grid thumbs
  createdAt: string;
};
// also exported: defaultLabels, defaultToolbar, toVideoEmbedUrl, normalizeLinkUrl, isAllowedEmbedSrc, types Labels, EditorClassNames, ToolbarItem, PickedImage, MediaPickerRenderProps, EmbedProvider

// "@ilamanownuk/blog-kit/renderer"  (server-safe)
function RichContent(props: {
  html: string; className?: string; dir?: "rtl"|"ltr" /* "rtl" */; lang?: string /* "fa" */;
  allowedEmbeds?: readonly EmbedProvider[]; isAllowedImageSrc?: (src: string) => boolean;
}): JSX.Element;   // renders <div class="bk-rich ...">, always re-sanitizes

// "@ilamanownuk/blog-kit/server"
function sanitizeRichText(html: string, o?: { allowedEmbeds?: readonly EmbedProvider[]; isAllowedImageSrc?: (src: string) => boolean }): string;
function hasRichContent(html: string, o?: same options): boolean;   // text, img, allowed iframe or table
function richTextToPlain(html: string): string;                      // tag-free text for excerpts / meta
```

Sanitizer allowlist: p, br, strong, em, u, s, h2-h4, ul, ol, li, blockquote, pre, code, a, hr, img (https only), table parts, mark, span (only text-align/color/background-color styles), iframe (only allowed embed providers; attributes rebuilt). Links get `rel="noopener noreferrer nofollow"`.

CSS variables (`--bk-*`): accent, accent-contrast, fg, muted-fg, bg, surface, muted, border, danger, code-bg, code-fg, code-inline-bg, mark-bg, hr-color, table-border, table-head-bg, backdrop, font, code-font, font-size, line-height, h2-size, h3-size, h4-size, heading-weight, radius, media-radius, block-gap, editor-min-height, editor-padding, toolbar-padding, toolbar-gap, control-size, dialog-width, dialog-wide-width, popover-shadow, dialog-shadow, z-toolbar, z-popover; optional: link, heading-color, quote-border, radius-sm, radius-lg, focus-ring. Dark preset: `[data-bk-theme="dark"]`, `.dark`, or `data-bk-theme="auto"`. Content class: `.bk-rich`; UI classes: `.bk-*`.

# 5. Step 3: verify

- Run the project's typecheck, lint and build (use existing scripts, e.g. `tsc --noEmit`, `next build`). Fix every error you introduced.
- Run existing tests; update ones that referenced removed code.
- If you can run the app, open the admin post form and a published post page: check that the toolbar is styled, RTL works, an image can be inserted (upload and/or library), an Aparat or YouTube link becomes a video, saving stores sanitized HTML, and the public page renders it. Also paste `<script>alert(1)</script><img src=x onerror=alert(1)>` as content through the server path and confirm it is stripped.
- Check dark mode (if the project has one) and the mobile width.

# 6. Final report (keep it short)

List: files created/changed/removed, how upload/media adapters were connected (or why skipped), shared constants location, theme mapping done, commands run and their results, and anything left for the human (e.g. data migration, missing upload endpoint). Do not paste large code.
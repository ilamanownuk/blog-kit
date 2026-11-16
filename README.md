# @ilamanownuk/blog-kit

ویرایشگر متن غنی Tiptap برای بلاگ (Next.js / NestJS) — درج ویدیو از **آپارات و یوتیوب**، آپلود تصویر، انتخاب از **کتابخانه‌ی رسانه**، و sanitizer سمت سرور.
Reusable Tiptap blog editor with Aparat/YouTube embeds, image upload, a media-library picker, a server sanitizer and a renderer. RTL and Persian by default; no Tailwind required.

## Install / نصب

```bash
pnpm add @ilamanownuk/blog-kit
```

Peer deps: `react` and `react-dom` >= 19.

| Entry | Use |
| --- | --- |
| `@ilamanownuk/blog-kit` | `RichTextEditor` (client component, ships `"use client"`) |
| `@ilamanownuk/blog-kit/renderer` | `RichContent` (works in Server Components) |
| `@ilamanownuk/blog-kit/server` | `sanitizeRichText`, `hasRichContent`, `richTextToPlain` (no React) |
| `@ilamanownuk/blog-kit/styles.css` | Styles (CSS variables `--bk-*`, logical properties for RTL) |

Import the CSS once (e.g. in `app/layout.tsx`):

```ts
import "@ilamanownuk/blog-kit/styles.css";
```

## Editor

```tsx
"use client";
import { RichTextEditor } from "@ilamanownuk/blog-kit";
import { uploadPostImage } from "./actions";

export function PostForm() {
  const [html, setHtml] = useState("");
  return <RichTextEditor value={html} onChange={setHtml} uploadImage={uploadPostImage} />;
}
```

Props: `value`, `onChange(html)` (empty editor emits `""`), `placeholder`, `invalid`, `id`, `className`, `uploadImage`, `mediaApi`, `renderMediaPicker`, `resolveImageSrc`, `allowedEmbeds` (default `["aparat","youtube"]`), `labels`, `dir` (default `"rtl"`).
Extensions are created once on mount, so `allowedEmbeds`/`placeholder` should be stable.

### Image upload via a Next.js server action

`uploadImage(file) => Promise<{ url: string; alt?: string }>`; throwing shows the error message in the dialog. Only `https://` image URLs are accepted.

```ts
// actions.ts
"use server";
export async function uploadPostImage(file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${process.env.API_URL}/media`, { method: "POST", body, headers: { authorization: `Bearer ${await getToken()}` } });
  if (!res.ok) throw new Error("آپلود ناموفق بود");
  const { url } = await res.json();
  return { url };
}
```

### Media library

Built-in picker driven by a `mediaApi` (implement with server actions so tokens stay on the server):

```tsx
<RichTextEditor
  value={html}
  onChange={setHtml}
  mediaApi={{
    list: ({ q, page }) => listMedia({ q, page }),     // -> { items, total, page, pageSize, error? }
    upload: (formData) => uploadMedia(formData),        // formData.get("file") -> { items, error? }
  }}
  resolveImageSrc={(url) => url.replace(/\.(\w+)$/, "-960.$1")}  // optional
/>
```

`MediaItem`: `{ id, url, originalName, mimeType, sizeBytes, width, height, alt, variants: { "320": {url,width,height} }, createdAt }`. Grid thumbnails use `variants["320"]` when present.

Or bring your own picker (takes precedence over `mediaApi`):

```tsx
<RichTextEditor
  renderMediaPicker={({ onSelect, close }) => (
    <MyPicker onPick={(m) => onSelect({ url: m.url, alt: m.alt })} onCancel={close} />
  )}
  ...
/>
```

### Labels

All strings are Persian; override any with `labels` (see `defaultLabels` export for keys):

```tsx
<RichTextEditor labels={{ bold: "Bold", imageTitle: "Insert image", videoError: "Aparat or YouTube links only." }} dir="ltr" ... />
```

### Embeds

`allowedEmbeds={["aparat"]}` limits the toolbar, the editor parser **and** (when passed identically) the sanitizer. YouTube links are converted to `youtube-nocookie.com`.

## Server: always sanitize

Editor HTML is untrusted input. Sanitize when saving and again when rendering.

```ts
// Next.js server action / NestJS service
import { sanitizeRichText, hasRichContent, richTextToPlain } from "@ilamanownuk/blog-kit/server";

const clean = sanitizeRichText(dto.content, {
  allowedEmbeds: ["aparat", "youtube"],                       // must match the editor
  isAllowedImageSrc: (src) => src.startsWith("https://cdn.example.com/"), // optional, https is always required
});
if (!hasRichContent(clean)) throw new BadRequestException("Empty content");
const description = richTextToPlain(clean).slice(0, 160);
```

NestJS example:

```ts
@Injectable()
export class PostsService {
  create(dto: CreatePostDto) {
    return this.prisma.post.create({ data: { ...dto, content: sanitizeRichText(dto.content) } });
  }
}
```

## Render

```tsx
import { RichContent } from "@ilamanownuk/blog-kit/renderer";
<RichContent html={post.content} />   // sanitizes again, dir="rtl" lang="fa"
```

## Styling

Override variables: `--bk-accent`, `--bk-fg`, `--bk-bg`, `--bk-border`, `--bk-radius`, `--bk-editor-min-height`, ... (see `src/styles.css`). Content uses the `.bk-rich` class.

## Updating in your projects

Bump the version (`pnpm up @ilamanownuk/blog-kit`) or let Renovate/Dependabot open the PR. Releases follow semver; the HTML allowlist lives in one place (`/server`), so editor, backend and renderer stay in sync when they share a version.

## Development

```bash
pnpm install && pnpm typecheck && pnpm test && pnpm build
```

MIT

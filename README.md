# @ilamanownuk/blog-kit

ویرایشگر متن غنی (مبتنی بر Tiptap) برای بلاگ و مجله‌ی آنلاین، با پشتیبانی کامل از فارسی و راست‌به‌چین. این پکیج همه‌ی کارهای لازم برای یک بلاگ را در یک بسته می‌دهد: ادیتور، آپلود عکس، کتابخانه‌ی رسانه، درج ویدیوی آپارات و یوتیوب، پاک‌سازی امن HTML در سرور، و کامپوننت نمایش پست.

> اگر می‌خواهید یک هوش مصنوعی (Claude، Cursor، Copilot و...) پکیج را برایتان نصب کند، فایل [`AI_INSTALL_PROMPT.md`](./AI_INSTALL_PROMPT.md) را باز کنید و متنش را به آن بدهید.

## فهرست

- [امکانات](#امکانات)
- [نصب](#نصب)
- [افزودن استایل](#افزودن-استایل)
- [استفاده‌ی سریع (ادیتور)](#استفادهی-سریع-ادیتور)
- [ذخیره در سرور (Server Action و Prisma)](#ذخیره-در-سرور-server-action-و-prisma)
- [استفاده با NestJS](#استفاده-با-nestjs)
- [نمایش پست با RichContent](#نمایش-پست-با-richcontent)
- [آپلود عکس](#آپلود-عکس)
- [کتابخانه‌ی رسانه](#کتابخانهی-رسانه)
- [ویدیوی آپارات و یوتیوب](#ویدیوی-آپارات-و-یوتیوب)
- [شخصی‌سازی ظاهر](#شخصیسازی-ظاهر)
- [تغییر متن‌ها (labels)](#تغییر-متنها-labels)
- [سئو](#سئو)
- [جدول کامل props](#جدول-کامل-props)
- [به‌روزرسانی پکیج](#بهروزرسانی-پکیج)
- [عیب‌یابی](#عیبیابی)
- [English summary](#english-summary)

## امکانات

- ادیتور Tiptap با نوار ابزار آماده: پررنگ، مورب، زیرخط، تیتر، تراز، لیست، نقل‌قول، کد، لینک، جدول، رنگ متن و هایلایت.
- راست‌به‌چین و فارسی به‌صورت پیش‌فرض (قابل تغییر به چپ‌به‌راست).
- آپلود تصویر و انتخاب از کتابخانه‌ی رسانه (با آداپتور؛ هر بک‌اندی را می‌شود وصل کرد).
- درج ویدیو از آپارات و یوتیوب (یوتیوب به `youtube-nocookie.com` تبدیل می‌شود).
- پاک‌سازی HTML در سرور با لیست مجاز (allowlist) و جلوگیری از XSS.
- کامپوننت `RichContent` برای نمایش پست، سازگار با Server Components.
- بدون نیاز به Tailwind؛ ظاهر با متغیرهای CSS با پیشوند `--bk-` کاملاً قابل تنظیم است، با تم تیره‌ی آماده.
- خروجی ادیتور یک رشته‌ی HTML ساده است؛ در هر دیتابیسی (مثلاً یک ستون `Text`) ذخیره می‌شود.

## نصب

```bash
pnpm add @ilamanownuk/blog-kit
# یا: npm i @ilamanownuk/blog-kit   |   yarn add @ilamanownuk/blog-kit
```

پیش‌نیازها: `react` و `react-dom` نسخه‌ی ۱۹ یا بالاتر (peer dependency). Tiptap، آیکن‌ها و sanitizer خودشان همراه پکیج نصب می‌شوند؛ **Tiptap را جداگانه نصب نکنید** تا نسخه‌ها دوتا نشوند.

پکیج چهار ورودی دارد:

| ورودی | کاربرد |
| --- | --- |
| `@ilamanownuk/blog-kit` | کامپوننت `RichTextEditor` (کلاینتی؛ خودش `"use client"` دارد) |
| `@ilamanownuk/blog-kit/renderer` | کامپوننت `RichContent` برای نمایش (در Server Component هم کار می‌کند) |
| `@ilamanownuk/blog-kit/server` | `sanitizeRichText`، `hasRichContent`، `richTextToPlain` (بدون React) |
| `@ilamanownuk/blog-kit/styles.css` | استایل‌ها |

## افزودن استایل

فایل استایل را فقط یک بار در لایه‌ی اصلی پروژه وارد کنید. در Next.js (App Router) در `app/layout.tsx`:

```tsx
import "@ilamanownuk/blog-kit/styles.css";
```

یا در فایل CSS اصلی (مثلاً با Tailwind v4 در `globals.css`):

```css
@import "tailwindcss";
@import "@ilamanownuk/blog-kit/styles.css";
```

همه‌ی استایل‌ها داخل `@layer blog-kit` هستند، یعنی CSS خودتان همیشه برنده است. جزئیات در بخش [شخصی‌سازی ظاهر](#شخصیسازی-ظاهر).

## استفاده‌ی سریع (ادیتور)

ادیتور یک کامپوننت کنترل‌شده است: `value` و `onChange` با رشته‌ی HTML.

```tsx
"use client";

import { useState } from "react";
import { RichTextEditor } from "@ilamanownuk/blog-kit";

export function PostForm() {
  const [html, setHtml] = useState("");

  return (
    <RichTextEditor
      value={html}
      onChange={setHtml}
      placeholder="متن مقاله را بنویسید…"
    />
  );
}
```

نکته‌ها:

- اگر ادیتور خالی باشد `onChange` مقدار `""` می‌فرستد (نه `<p></p>`).
- با عوض شدن `value` از بیرون (مثلاً بارگذاری پست دیگر) محتوای ادیتور هم به‌روز می‌شود.
- افزونه‌های ادیتور فقط یک بار هنگام mount ساخته می‌شوند؛ پس `allowedEmbeds` و `placeholder` را ثابت نگه دارید.
- ادیتور باید داخل کامپوننت کلاینتی (`"use client"`) استفاده شود.

## ذخیره در سرور (Server Action و Prisma)

HTML ادیتور ورودی غیرقابل‌اعتماد است. **همیشه** آن را هنگام ذخیره در سرور پاک‌سازی کنید (و هنگام نمایش دوباره، که `RichContent` خودش انجام می‌دهد). پاک‌سازی فقط در مرورگر کافی نیست.

نمونه‌ی مدل Prisma:

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  slug      String   @unique
  excerpt   String?
  body      String   @db.Text   // HTML پاک‌سازی‌شده
  createdAt DateTime @default(now())
}
```

نمونه‌ی Server Action:

```ts
// app/admin/posts/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { hasRichContent, richTextToPlain, sanitizeRichText } from "@ilamanownuk/blog-kit/server";
import { prisma } from "@/lib/prisma";

export async function createPost(input: { title: string; slug: string; body: string }) {
  // اینجا احراز هویت و بررسی دسترسی را هم انجام دهید.
  const body = sanitizeRichText(input.body, {
    allowedEmbeds: ["aparat", "youtube"], // باید با ادیتور یکسان باشد
    isAllowedImageSrc: (src) => src.startsWith("https://cdn.example.com/"), // اختیاری
  });

  if (!hasRichContent(body)) return { error: "متن مقاله خالی است." };

  await prisma.post.create({
    data: {
      title: input.title,
      slug: input.slug,
      body,
      excerpt: richTextToPlain(body).slice(0, 160),
    },
  });
  revalidatePath("/blog");
  return { ok: true };
}
```

## استفاده با NestJS

`/server` هیچ وابستگی به React ندارد و در سرویس Nest به‌سادگی کار می‌کند:

```ts
import { BadRequestException, Injectable } from "@nestjs/common";
import { hasRichContent, richTextToPlain, sanitizeRichText } from "@ilamanownuk/blog-kit/server";

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePostDto) {
    const body = sanitizeRichText(dto.body);
    if (!hasRichContent(body)) throw new BadRequestException("متن مقاله خالی است");

    return this.prisma.post.create({
      data: { ...dto, body, excerpt: richTextToPlain(body).slice(0, 160) },
    });
  }
}
```

در این حالت ادیتور در فرانت‌اند (Next.js) است و HTML را از طریق API به Nest می‌فرستد. خروجی CommonJS هم موجود است.

## نمایش پست با RichContent

```tsx
// app/blog/[slug]/page.tsx  (Server Component)
import { RichContent } from "@ilamanownuk/blog-kit/renderer";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <RichContent html={post.body} />
    </article>
  );
}
```

`RichContent` قبل از نمایش، HTML را دوباره پاک‌سازی می‌کند. هرگز HTML پست را با `dangerouslySetInnerHTML` مستقیم رندر نکنید.

Props: `html` (الزامی)، `className`، `dir` (پیش‌فرض `"rtl"`)، `lang` (پیش‌فرض `"fa"`)، `allowedEmbeds`، `isAllowedImageSrc`. دو گزینه‌ی آخر باید با تنظیمات ذخیره‌سازی یکی باشند.

## آپلود عکس

اگر `uploadImage` بدهید، در پنجره‌ی درج تصویر دکمه‌ی «آپلود تصویر» ظاهر می‌شود. این تابع فایل را می‌گیرد و باید `{ url, alt? }` برگرداند. اگر خطا پرتاب کند، پیام آن داخل پنجره نمایش داده می‌شود. فقط آدرس‌های `https://` پذیرفته می‌شوند.

```ts
// app/admin/actions.ts
"use server";

export async function uploadPostImage(formData: FormData) {
  const file = formData.get("file") as File;
  // فایل را در S3 / دیسک / هر جای دیگر ذخیره کنید
  const url = await saveToStorage(file);
  return { url }; // باید https باشد
}
```

```tsx
<RichTextEditor
  value={html}
  onChange={setHtml}
  uploadImage={async (file) => {
    const formData = new FormData();
    formData.set("file", file);
    return uploadPostImage(formData);
  }}
/>
```

با `resolveImageSrc` می‌توانید آدرس را قبل از درج تغییر دهید (مثلاً انتخاب نسخه‌ی ۹۶۰ پیکسلی):

```tsx
resolveImageSrc={(url) => url.replace(/\.(\w+)$/, "-960.$1")}
```

## کتابخانه‌ی رسانه

برای انتخاب از تصاویر قبلی، `mediaApi` را بدهید. دو تابع دارد؛ بهتر است با Server Action پیاده شوند تا توکن‌ها در سرور بمانند:

```tsx
<RichTextEditor
  value={html}
  onChange={setHtml}
  mediaApi={{
    list: ({ q, page }) => listMedia({ q, page }),  // → { items, total, page, pageSize, error? }
    upload: (formData) => uploadMedia(formData),    // formData.get("file") → { items, error? }
  }}
/>
```

شکل هر آیتم (`MediaItem`):

```ts
{
  id: string; url: string; originalName: string; mimeType: string; sizeBytes: number;
  width: number; height: number; alt: string | null;
  variants: Record<string, { url: string; width: number; height: number }>; // کلید "320" برای بندانگشتی
  createdAt: string;
}
```

اگر کتابخانه‌ی رسانه‌ی خودتان رابط کاربری دارد، با `renderMediaPicker` آن را جایگزین کنید (در اولویت بالاتر از `mediaApi` است):

```tsx
<RichTextEditor
  value={html}
  onChange={setHtml}
  renderMediaPicker={({ onSelect, close }) => (
    <MyMediaPicker
      onPick={(m) => onSelect({ url: m.url, alt: m.alt ?? undefined })}
      onCancel={close}
    />
  )}
/>
```

## ویدیوی آپارات و یوتیوب

کاربر لینک صفحه‌ی ویدیو را می‌چسباند (مثلاً `https://www.aparat.com/v/xxxx` یا لینک یوتیوب) و پکیج آن را به آدرس embed امن تبدیل می‌کند. به‌طور پیش‌فرض هر دو مجاز هستند. برای محدود کردن:

```tsx
// ادیتور
<RichTextEditor allowedEmbeds={["aparat"]} ... />

// سرور و نمایش، دقیقاً همان مقدار
sanitizeRichText(html, { allowedEmbeds: ["aparat"] });
<RichContent html={html} allowedEmbeds={["aparat"]} />
```

اگر مقدار در ادیتور و سرور فرق کند، `iframe` در سرور حذف می‌شود. بهتر است مقدار را در یک ثابت مشترک بگذارید:

```ts
export const EMBEDS = ["aparat", "youtube"] as const;
```

## شخصی‌سازی ظاهر

ظاهر پیش‌فرض همین است که می‌بینید، ولی هر چیزی قابل تغییر است.

### ۱. متغیرهای CSS

متغیرها را روی `:root` یا هر عنصر والد بازنویسی کنید:

```css
:root {
  --bk-accent: #2563eb;          /* رنگ اصلی: لینک، دکمه‌ی اصلی، فوکوس */
  --bk-radius: 0.75rem;          /* گردی گوشه‌ها */
  --bk-font: "Vazirmatn", sans-serif;
  --bk-line-height: 2;
  --bk-editor-min-height: 480px;
}
```

متغیرهای اصلی:

| گروه | متغیرها |
| --- | --- |
| رنگ | `--bk-accent`، `--bk-accent-contrast`، `--bk-fg`، `--bk-muted-fg`، `--bk-bg`، `--bk-surface`، `--bk-muted`، `--bk-border`، `--bk-danger`، `--bk-code-bg`، `--bk-code-fg`، `--bk-code-inline-bg`، `--bk-mark-bg`، `--bk-hr-color`، `--bk-table-border`، `--bk-table-head-bg`، `--bk-backdrop` |
| تایپوگرافی | `--bk-font`، `--bk-code-font`، `--bk-font-size`، `--bk-line-height`، `--bk-h2-size`، `--bk-h3-size`، `--bk-h4-size`، `--bk-heading-weight` |
| شکل و فاصله | `--bk-radius`، `--bk-media-radius`، `--bk-block-gap`، `--bk-editor-min-height`، `--bk-editor-padding`، `--bk-toolbar-padding`، `--bk-toolbar-gap`، `--bk-control-size`، `--bk-dialog-width`، `--bk-dialog-wide-width` |
| سایه و لایه | `--bk-popover-shadow`، `--bk-dialog-shadow`، `--bk-z-toolbar`، `--bk-z-popover` |
| اختیاری (پیش‌فرض ندارند) | `--bk-link`، `--bk-heading-color`، `--bk-quote-border`، `--bk-radius-sm`، `--bk-radius-lg`، `--bk-focus-ring` |

### ۲. تم تیره

برای تم تیره‌ی آماده، روی `<html>` (یا `<body>`) صفت `data-bk-theme="dark"` را بگذارید. اگر پروژه‌تان کلاس `.dark` (مثل Tailwind و shadcn) دارد، همان هم کار می‌کند. مقدار `auto` از تنظیم سیستم کاربر پیروی می‌کند:

```html
<html data-bk-theme="dark"> … </html>
<html data-bk-theme="auto"> … </html>
```

پنجره‌های گفتگو (dialog) داخل `<body>` رندر می‌شوند؛ پس صفت تم را روی `html` یا `body` بگذارید، نه فقط روی یک wrapper.

برای هماهنگی با تم خودتان (مثلاً shadcn) کافی است متغیرها را به رنگ‌های آن وصل کنید:

```css
:root {
  --bk-fg: var(--foreground);
  --bk-bg: var(--background);
  --bk-border: var(--border);
  --bk-muted: var(--muted);
  --bk-accent: var(--primary);
  --bk-accent-contrast: var(--primary-foreground);
}
```

### ۳. classNames

با prop به نام `classNames` به هر بخش ادیتور کلاس اضافه کنید (کلاس‌های Tailwind هم می‌شود):

```tsx
<RichTextEditor
  value={html}
  onChange={setHtml}
  classNames={{
    root: "shadow-sm",
    toolbar: "bg-white/80 backdrop-blur",
    button: "hover:bg-amber-50",
    content: "min-h-[500px]",
    dialog: "rounded-2xl",
  }}
/>
```

بخش‌های موجود: `root`، `toolbar`، `separator`، `button`، `content`، `tableTools`، `popover`، `dialog`، `input`، `label`. کلاس `content` فقط هنگام mount خوانده می‌شود. در `RichContent` هم `className` دارید.

### ۴. نوار ابزار

با `toolbar` مشخص کنید کدام دکمه‌ها و با چه ترتیبی نمایش داده شوند. علامت `"|"` جداکننده است:

```tsx
<RichTextEditor
  toolbar={["bold", "italic", "link", "|", "h2", "h3", "|", "bullet", "ordered", "|", "image", "video"]}
  ...
/>
```

کلیدها: `bold italic underline strike textColor highlight h2 h3 h4 right center left justify bullet ordered quote code hr link unlink image video table undo redo`. مقدار پیش‌فرض با `defaultToolbar` قابل import است تا از روی آن کپی و ویرایش کنید. پنهان کردن یک دکمه، قابلیت را از ادیتور حذف نمی‌کند (فقط دکمه‌اش نیست).

### ۵. اولویت CSS شما و Tailwind

فایل `styles.css` همه‌ی قواعد را در `@layer blog-kit` می‌گذارد، پس هر CSS بدون لایه‌ی شما روی آن غلبه می‌کند. در Tailwind v4 ترتیب لایه‌ها را صریح بنویسید تا `blog-kit` بعد از `base` (preflight) و قبل از `utilities` بیاید؛ در این حالت کلاس‌های ابزاری Tailwind هم روی آن غلبه می‌کنند:

```css
@layer theme, base, blog-kit, components, utilities;
@import "tailwindcss";
@import "@ilamanownuk/blog-kit/styles.css";
```

اگر لایه‌ها را نمی‌خواهید، نسخه‌ی بدون لایه را وارد کنید (باید بعد از Tailwind/reset بیاید):

```css
@import "@ilamanownuk/blog-kit/styles.unlayered.css";
```

برای بازنویسی کامل، با انتخابگرهای `.bk-*` (مثل `.bk-btn`، `.bk-toolbar`، `.bk-rich h2`) هر چیزی را عوض کنید. محتوای پست داخل کلاس `.bk-rich` است.

## تغییر متن‌ها (labels)

همه‌ی متن‌ها فارسی هستند. هر کدام را با `labels` عوض کنید (کلیدها در `defaultLabels` هست):

```tsx
import { RichTextEditor, defaultLabels } from "@ilamanownuk/blog-kit";

<RichTextEditor
  dir="ltr"
  labels={{ bold: "Bold", imageTitle: "Insert image", videoError: "Aparat or YouTube links only." }}
  ...
/>
```

## سئو

متن ساده‌ی پست را برای توضیح متا بسازید و آن را در `generateMetadata` بگذارید:

```tsx
import type { Metadata } from "next";
import { richTextToPlain } from "@ilamanownuk/blog-kit/server";

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  const description = post.metaDescription ?? richTextToPlain(post.body).slice(0, 160);
  return { title: post.metaTitle ?? post.title, description };
}
```

نکته‌ها: لینک‌های بیرونی خودکار `rel="noopener noreferrer nofollow"` می‌گیرند، تصاویر `loading="lazy"` دارند، و برای سئوی بهتر همیشه متن جایگزین (alt) تصویر را پر کنید. تیترهای ادیتور از `h2` شروع می‌شوند، چون `h1` عنوان صفحه است.

## جدول کامل props

### `RichTextEditor`

| prop | نوع | توضیح |
| --- | --- | --- |
| `value` | `string` | HTML فعلی (الزامی) |
| `onChange` | `(html: string) => void` | با هر تغییر؛ ادیتور خالی `""` می‌فرستد (الزامی) |
| `placeholder` | `string` | متن راهنما؛ پیش‌فرض از `labels.placeholder` |
| `invalid` | `boolean` | کادر قرمز (رنگ `--bk-danger`) |
| `id` | `string` | `id` ناحیه‌ی نوشتن، برای `<label htmlFor>` |
| `className` | `string` | کلاس اضافه برای ریشه |
| `classNames` | `EditorClassNames` | کلاس اضافه به هر بخش |
| `toolbar` | `ToolbarItem[]` | انتخاب و ترتیب دکمه‌ها؛ پیش‌فرض `defaultToolbar` |
| `uploadImage` | `(file: File) => Promise<{url, alt?}>` | فعال‌کردن آپلود |
| `mediaApi` | `{ list, upload }` | کتابخانه‌ی رسانه‌ی داخلی |
| `renderMediaPicker` | `({ onSelect, close }) => ReactNode` | انتخابگر اختصاصی (اولویت با این است) |
| `resolveImageSrc` | `(url: string) => string` | تغییر آدرس تصویر پیش از درج |
| `allowedEmbeds` | `("aparat" \| "youtube")[]` | پیش‌فرض هر دو؛ با سرور یکی باشد |
| `labels` | `Partial<Labels>` | تغییر متن‌ها |
| `dir` | `"rtl" \| "ltr"` | پیش‌فرض `"rtl"` |

### `RichContent`

| prop | نوع | توضیح |
| --- | --- | --- |
| `html` | `string` | HTML ذخیره‌شده (الزامی) |
| `className` | `string` | کلاس اضافه روی `.bk-rich` |
| `dir` / `lang` | `"rtl" \| "ltr"` / `string` | پیش‌فرض `"rtl"` و `"fa"` |
| `allowedEmbeds` | `EmbedProvider[]` | مثل سرور |
| `isAllowedImageSrc` | `(src: string) => boolean` | فیلتر اضافه‌ی تصویر |

### توابع `/server`

- `sanitizeRichText(html, { allowedEmbeds?, isAllowedImageSrc? })` رشته‌ی پاک‌سازی‌شده برمی‌گرداند.
- `hasRichContent(html, options?)` اگر متن، تصویر، ویدیو یا جدول داشته باشد `true`.
- `richTextToPlain(html)` متن ساده بدون تگ.
- همچنین `toVideoEmbedUrl`، `normalizeLinkUrl`، `isAllowedEmbedSrc` و `ALL_EMBED_PROVIDERS`.

## به‌روزرسانی پکیج

```bash
pnpm up @ilamanownuk/blog-kit
pnpm up @ilamanownuk/blog-kit --latest
```

برای خودکار شدن، Renovate یا Dependabot را فعال کنید تا برای هر نسخه‌ی جدید یک Pull Request باز شود. نسخه‌ها از semver پیروی می‌کنند و تغییرات در [`CHANGELOG.md`](./CHANGELOG.md) هستند. چون لیست مجاز HTML فقط در یک جا (`/server`) تعریف شده، وقتی ادیتور، بک‌اند و نمایش از یک نسخه استفاده کنند همیشه هماهنگ می‌مانند.

## عیب‌یابی

| مشکل | علت و راه‌حل |
| --- | --- |
| خطای `window is not defined` یا `document is not defined` | ادیتور را در یک فایل `"use client"` استفاده کنید. اگر هنوز مشکل داشت، با `next/dynamic` و `{ ssr: false }` بارگذاری کنید. |
| ادیتور بدون ظاهر است (دکمه‌ها و کادر استایل ندارند) | `import "@ilamanownuk/blog-kit/styles.css"` را فراموش کرده‌اید، یا ترتیب لایه‌ها در Tailwind درست نیست؛ بخش «اولویت CSS» را ببینید. |
| استایل پیش‌فرض Tailwind (preflight) لیست‌ها و تیترها را خراب کرده | ترتیب `@layer theme, base, blog-kit, components, utilities;` را بنویسید یا `styles.unlayered.css` را بعد از Tailwind وارد کنید. |
| ویدیو بعد از ذخیره ناپدید می‌شود (`iframe` حذف شده) | `allowedEmbeds` در ادیتور و سرور یکی نیست، یا آدرس از آپارات/یوتیوب نیست. |
| عکس بعد از ذخیره حذف می‌شود | آدرس `https` نیست یا `isAllowedImageSrc` آن را رد می‌کند. |
| تم تیره در پنجره‌ها اعمال نمی‌شود | `data-bk-theme="dark"` را روی `html` یا `body` بگذارید، نه روی wrapper. |
| تغییر `placeholder` یا `allowedEmbeds` اثر ندارد | این مقادیر فقط هنگام mount خوانده می‌شوند؛ مقدار ثابت بدهید یا با `key` کامپوننت را دوباره بسازید. |
| دو نسخه‌ی Tiptap در پروژه | پکیج‌های `@tiptap/*` را از `package.json` پروژه حذف کنید (اگر جای دیگری استفاده نمی‌شوند). |

## English summary

A Tiptap-based rich-text editor kit for blogs: RTL/Persian by default, image upload and media-library adapters, Aparat/YouTube embeds, a server-side allowlist sanitizer and a Server-Component-friendly renderer. Output is plain HTML. No Tailwind required.

```tsx
import "@ilamanownuk/blog-kit/styles.css";
import { RichTextEditor } from "@ilamanownuk/blog-kit";           // client
import { RichContent } from "@ilamanownuk/blog-kit/renderer";      // server-safe
import { sanitizeRichText } from "@ilamanownuk/blog-kit/server";   // always sanitize on save
```

Theming: override `--bk-*` CSS variables, use `data-bk-theme="dark"`, pass `classNames` / `toolbar` props; all CSS is inside `@layer blog-kit` (or import `styles.unlayered.css`). See `AI_INSTALL_PROMPT.md` for an agent-ready installation prompt and the full API reference.

## توسعه

```bash
pnpm install && pnpm typecheck && pnpm test && pnpm build
```

MIT

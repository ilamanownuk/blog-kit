import { type SanitizeRichTextOptions, sanitizeRichText } from "../server";

export type RichContentProps = SanitizeRichTextOptions & {
  html: string;
  className?: string;
  dir?: "rtl" | "ltr";
  lang?: string;
};

/** Renders editor HTML. It is always sanitized again here; works in React Server Components. */
export function RichContent({
  html,
  className,
  dir = "rtl",
  lang = "fa",
  allowedEmbeds,
  isAllowedImageSrc,
}: RichContentProps) {
  return (
    <div
      className={className ? `bk-rich ${className}` : "bk-rich"}
      dir={dir}
      lang={lang}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html, { allowedEmbeds, isAllowedImageSrc }) }}
    />
  );
}

export { sanitizeRichText };
export type { SanitizeRichTextOptions };

import sanitizeHtml from "sanitize-html";
import {
  ALL_EMBED_PROVIDERS,
  EMBED_PROVIDERS,
  type EmbedProvider,
  isAllowedEmbedSrc,
  normalizeLinkUrl,
  toVideoEmbedUrl,
} from "../shared/embed";

export { ALL_EMBED_PROVIDERS, EMBED_PROVIDERS, isAllowedEmbedSrc, normalizeLinkUrl, toVideoEmbedUrl };
export type { EmbedProvider };

export type SanitizeRichTextOptions = {
  /** Iframe providers kept in the output. Default: aparat + youtube. Must match the editor. */
  allowedEmbeds?: readonly EmbedProvider[];
  /** Extra image filter (e.g. only your bucket). Images must always be https; rejected img tags are removed. */
  isAllowedImageSrc?: (src: string) => boolean;
};

const COLOR = [
  /^#[0-9a-f]{3,8}$/i,
  /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/i,
];

const IFRAME_SANDBOX = "allow-scripts allow-same-origin allow-presentation";

/** Allowlist sanitizer for editor output. Run it when saving AND again before rendering. */
export function sanitizeRichText(html: string, options: SanitizeRichTextOptions = {}): string {
  const embeds = options.allowedEmbeds ?? ALL_EMBED_PROVIDERS;
  const extraImageFilter = options.isAllowedImageSrc;
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "em", "u", "s", "h2", "h3", "h4", "ul", "ol", "li", "blockquote",
      "pre", "code", "a", "hr", "img", "table", "thead", "tbody", "tr", "th", "td", "mark",
      "span", "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      mark: ["data-color"],
      iframe: ["src", "sandbox", "loading", "allowfullscreen"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(right|left|center|justify)$/],
        color: COLOR,
        "background-color": COLOR,
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"], iframe: ["https"] },
    allowProtocolRelative: false,
    allowedIframeHostnames: embeds.map((name) => EMBED_PROVIDERS[name].hostname),
    transformTags: {
      a: (tagName, attribs) => {
        const rest = { ...attribs };
        delete rest.target;
        const external = /^https?:\/\//i.test(attribs.href ?? "");
        return {
          tagName,
          attribs: { ...rest, rel: "noopener noreferrer nofollow", ...(external ? { target: "_blank" } : {}) },
        };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
      // Rebuild iframe attributes from scratch: nothing from the input except src survives.
      iframe: (tagName, attribs) => ({
        tagName,
        attribs: { src: attribs.src ?? "", sandbox: IFRAME_SANDBOX, loading: "lazy", allowfullscreen: "true" },
      }),
    },
    exclusiveFilter: (frame) => {
      const src = frame.attribs.src ?? "";
      if (frame.tag === "img") return !(src.startsWith("https://") && (extraImageFilter?.(src) ?? true));
      if (frame.tag === "iframe") return !isAllowedEmbedSrc(src, embeds);
      return false;
    },
  });
}

/** Plain text (no tags): empty checks and SEO descriptions. */
export function richTextToPlain(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;| /g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when the HTML has real content (text, image, allowed video or table) after sanitizing. */
export function hasRichContent(html: string, options: SanitizeRichTextOptions = {}): boolean {
  const clean = sanitizeRichText(html, options);
  return Boolean(richTextToPlain(clean)) || /<(img|iframe|table)\b/.test(clean);
}

export type EmbedProvider = "aparat" | "youtube";

export const ALL_EMBED_PROVIDERS: readonly EmbedProvider[] = ["aparat", "youtube"];

type ProviderConfig = {
  hostname: string;
  /** Every accepted iframe src must start with this exact string. */
  prefix: string;
  /** Base used when building an embed URL from a watch link. */
  embedBase: string;
};

export const EMBED_PROVIDERS: Record<EmbedProvider, ProviderConfig> = {
  aparat: {
    hostname: "www.aparat.com",
    prefix: "https://www.aparat.com/video/video/embed/",
    embedBase: "https://www.aparat.com/video/video/embed/videohash/",
  },
  youtube: {
    hostname: "www.youtube-nocookie.com",
    prefix: "https://www.youtube-nocookie.com/embed/",
    embedBase: "https://www.youtube-nocookie.com/embed/",
  },
};

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;
const APARAT_ID = /^[A-Za-z0-9]{3,20}$/;

/** Watch link (Aparat / YouTube) to a safe embed URL; anything else returns null. */
export function toVideoEmbedUrl(
  input: string,
  allowed: readonly EmbedProvider[] = ALL_EMBED_PROVIDERS,
): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  const segments = url.pathname.split("/").filter(Boolean);

  if (host === "aparat.com") {
    if (!allowed.includes("aparat")) return null;
    const id =
      segments[0] === "v" ? segments[1] : segments.at(-1) === "frame" ? segments.at(-3) : undefined;
    return id && APARAT_ID.test(id) ? `${EMBED_PROVIDERS.aparat.embedBase}${id}/vt/frame` : null;
  }

  if (!allowed.includes("youtube")) return null;
  let id: string | null | undefined;
  if (host === "youtu.be") id = segments[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = ["embed", "shorts", "live"].includes(segments[0] ?? "") ? segments[1] : url.searchParams.get("v");
  }
  return id && YOUTUBE_ID.test(id) ? `${EMBED_PROVIDERS.youtube.embedBase}${id}` : null;
}

/** Strict allowlist check for an iframe src (exact host + path prefix, https, no credentials). */
export function isAllowedEmbedSrc(
  src: string,
  allowed: readonly EmbedProvider[] = ALL_EMBED_PROVIDERS,
): boolean {
  if (/[\s\\\u0000-\u001f]/.test(src)) return false;
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  return allowed.some((name) => {
    const provider = EMBED_PROVIDERS[name];
    return (
      src.startsWith(provider.prefix) &&
      url.hostname === provider.hostname &&
      url.pathname.startsWith(new URL(provider.prefix).pathname)
    );
  });
}

/** Link href: internal path, http(s), mailto/tel; no scheme means https. javascript:/data: are rejected. */
export function normalizeLinkUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/")) return value;
  if (/^(mailto|tel):[^\s]+$/i.test(value)) return value;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

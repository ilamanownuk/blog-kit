import { describe, expect, it } from "vitest";
import { hasRichContent, richTextToPlain, sanitizeRichText } from "../src/server";

const APARAT = "https://www.aparat.com/video/video/embed/videohash/AbC123/vt/frame";
const YT = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";

describe("sanitizeRichText", () => {
  it("strips scripts, handlers and javascript: links", () => {
    const out = sanitizeRichText(
      `<p onclick="x()">a<script>alert(1)</script><a href="javascript:alert(1)">b</a></p><style>p{}</style>`,
    );
    expect(out).not.toMatch(/script|onclick|javascript:|style>/i);
    expect(out).toContain("<p>a");
  });

  it("keeps aparat and youtube iframes with a forced sandbox", () => {
    for (const src of [APARAT, YT]) {
      const out = sanitizeRichText(`<iframe src="${src}" onload="x()" srcdoc="<script>1</script>"></iframe>`);
      expect(out).toContain(`src="${src}"`);
      expect(out).toContain('sandbox="allow-scripts allow-same-origin allow-presentation"');
      expect(out).not.toMatch(/onload|srcdoc/);
    }
  });

  it("removes iframes from other sources and bypass attempts", () => {
    const bad = [
      "https://evil.com/embed/x",
      "http://www.aparat.com/video/video/embed/x",
      "https://www.aparat.com.evil.com/video/video/embed/x",
      "https://www.aparat.com@evil.com/video/video/embed/x",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube-nocookie.com/embed/../../evil",
      "//www.youtube-nocookie.com/embed/x",
      "javascript:alert(1)",
      "data:text/html,<script>1</script>",
    ];
    for (const src of bad) {
      expect(sanitizeRichText(`<iframe src="${src}"></iframe>`)).not.toContain("iframe");
    }
  });

  it("honours allowedEmbeds", () => {
    expect(sanitizeRichText(`<iframe src="${YT}"></iframe>`, { allowedEmbeds: ["aparat"] })).not.toContain("iframe");
    expect(sanitizeRichText(`<iframe src="${APARAT}"></iframe>`, { allowedEmbeds: ["aparat"] })).toContain("iframe");
  });

  it("only keeps https images and applies isAllowedImageSrc", () => {
    expect(sanitizeRichText(`<img src="https://cdn.example.com/a.png" alt="x">`)).toContain("<img");
    for (const src of ["http://a.com/a.png", "data:image/png;base64,AAAA", "/a.png", "javascript:1"]) {
      expect(sanitizeRichText(`<img src="${src}">`)).not.toContain("<img");
    }
    const only = (s: string) => s.startsWith("https://cdn.example.com/");
    expect(sanitizeRichText(`<img src="https://other.com/a.png">`, { isAllowedImageSrc: only })).not.toContain("<img");
    expect(sanitizeRichText(`<img src="https://cdn.example.com/a.png">`, { isAllowedImageSrc: only })).toContain("<img");
  });

  it("hardens links and limits styles", () => {
    const out = sanitizeRichText(
      `<a href="https://x.com" target="_self">l</a><p style="text-align:center;color:#fff;position:fixed;background-image:url(x)">t</p>`,
    );
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain("text-align:center");
    expect(out).toContain("color:#fff");
    expect(out).not.toMatch(/position|background-image/);
  });
});

describe("plain text helpers", () => {
  it("richTextToPlain strips tags", () => {
    expect(richTextToPlain("<p>a&nbsp;&amp; <b>b</b></p>")).toBe("a & b");
  });
  it("hasRichContent", () => {
    expect(hasRichContent("<p></p>")).toBe(false);
    expect(hasRichContent("<p>hi</p>")).toBe(true);
    expect(hasRichContent(`<iframe src="${YT}"></iframe>`)).toBe(true);
    expect(hasRichContent(`<iframe src="https://evil.com/x"></iframe>`)).toBe(false);
    expect(hasRichContent(`<img src="https://a.com/a.png">`)).toBe(true);
  });
});

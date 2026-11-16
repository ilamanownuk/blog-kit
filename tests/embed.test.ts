import { describe, expect, it } from "vitest";
import { isAllowedEmbedSrc, normalizeLinkUrl, toVideoEmbedUrl } from "../src/shared/embed";

describe("toVideoEmbedUrl", () => {
  it("converts Aparat links", () => {
    expect(toVideoEmbedUrl("https://www.aparat.com/v/AbC123")).toBe(
      "https://www.aparat.com/video/video/embed/videohash/AbC123/vt/frame",
    );
  });

  it("converts YouTube link shapes to youtube-nocookie", () => {
    const expected = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";
    expect(toVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(expected);
    expect(toVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(expected);
    expect(toVideoEmbedUrl("https://m.youtube.com/shorts/dQw4w9WgXcQ")).toBe(expected);
    expect(toVideoEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(expected);
  });

  it("respects allowedEmbeds", () => {
    expect(toVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ", ["aparat"])).toBeNull();
    expect(toVideoEmbedUrl("https://www.aparat.com/v/AbC123", ["youtube"])).toBeNull();
  });

  it("rejects other hosts, http and garbage", () => {
    expect(toVideoEmbedUrl("http://www.aparat.com/v/AbC123")).toBeNull();
    expect(toVideoEmbedUrl("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(toVideoEmbedUrl("https://www.aparat.com.evil.com/v/AbC123")).toBeNull();
    expect(toVideoEmbedUrl("javascript:alert(1)")).toBeNull();
    expect(toVideoEmbedUrl("not a url")).toBeNull();
  });
});

describe("isAllowedEmbedSrc", () => {
  const ok = [
    "https://www.aparat.com/video/video/embed/videohash/AbC123/vt/frame",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
  ];
  it.each(ok)("accepts %s", (src) => expect(isAllowedEmbedSrc(src)).toBe(true));

  const bad = [
    "http://www.aparat.com/video/video/embed/x",
    "https://www.aparat.com@evil.com/video/video/embed/x",
    "https://www.aparat.com.evil.com/video/video/embed/x",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/../watch",
    "https://www.youtube-nocookie.com:8443/embed/x",
    "https://www.youtube-nocookie.com\\@evil.com/embed/x",
    "//www.youtube-nocookie.com/embed/x",
    "javascript:alert(1)",
    "",
  ];
  it.each(bad)("rejects %s", (src) => expect(isAllowedEmbedSrc(src)).toBe(false));

  it("respects allowedEmbeds", () => {
    expect(isAllowedEmbedSrc(ok[1]!, ["aparat"])).toBe(false);
  });
});

describe("normalizeLinkUrl", () => {
  it("normalizes safe links", () => {
    expect(normalizeLinkUrl("example.com")).toBe("https://example.com/");
    expect(normalizeLinkUrl("/news/1")).toBe("/news/1");
    expect(normalizeLinkUrl("mailto:a@b.co")).toBe("mailto:a@b.co");
  });
  it("rejects dangerous links", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.com", "", "  "]) {
      expect(normalizeLinkUrl(bad)).toBeNull();
    }
  });
});

import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { type EmbedProvider, normalizeLinkUrl } from "../shared/embed";
import { createVideoEmbed } from "./video-node";

/** Capabilities must stay in sync with the allowlist in `src/server/index.ts`. */
export function buildEditorExtensions(placeholder: string, allowedEmbeds: readonly EmbedProvider[], dir: "rtl" | "ltr") {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        isAllowedUri: (url) => normalizeLinkUrl(url) !== null,
      },
    }),
    // https images only; data: / relative paths are rejected on paste.
    Image.extend({
      parseHTML() {
        return [
          {
            tag: "img[src]",
            getAttrs: (element) =>
              ((element as HTMLElement).getAttribute("src") ?? "").startsWith("https://") ? null : false,
          },
        ];
      },
    }).configure({ allowBase64: false }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: ["right", "center", "left", "justify"],
      defaultAlignment: dir === "rtl" ? "right" : "left",
    }),
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    TableKit.configure({ table: { resizable: false } }),
    Placeholder.configure({ placeholder }),
    createVideoEmbed(allowedEmbeds),
  ];
}

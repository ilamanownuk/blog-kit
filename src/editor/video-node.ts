import { mergeAttributes, Node } from "@tiptap/react";
import { type EmbedProvider, isAllowedEmbedSrc } from "../shared/embed";

/** Video as a sandboxed iframe; iframes from any other source are dropped while parsing. */
export function createVideoEmbed(allowed: readonly EmbedProvider[]) {
  return Node.create({
    name: "videoEmbed",
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
      return { src: { default: null } };
    },

    parseHTML() {
      return [
        {
          tag: "iframe[src]",
          getAttrs: (element) => {
            const src = (element as HTMLElement).getAttribute("src");
            return src && isAllowedEmbedSrc(src, allowed) ? { src } : false;
          },
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "iframe",
        mergeAttributes(HTMLAttributes, {
          sandbox: "allow-scripts allow-same-origin allow-presentation",
          loading: "lazy",
          allowfullscreen: "true",
        }),
      ];
    },
  });
}

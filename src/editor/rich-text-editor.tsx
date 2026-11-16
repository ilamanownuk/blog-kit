"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { ALL_EMBED_PROVIDERS } from "../shared/embed";
import { buildEditorExtensions } from "./extensions";
import { defaultLabels, LabelsContext } from "./labels";
import { RichTextToolbar } from "./toolbar";
import type { RichTextEditorProps } from "./types";
import { ClassNamesContext, cx } from "./ui";

const EMPTY = {};

/**
 * Tiptap rich-text editor. Output is an HTML string; ALWAYS sanitize it on the server
 * (`@ilamanownuk/blog-kit/server`). Extensions are created once on mount.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  invalid,
  id,
  className,
  classNames,
  toolbar,
  uploadImage,
  mediaApi,
  renderMediaPicker,
  resolveImageSrc,
  allowedEmbeds = ALL_EMBED_PROVIDERS,
  labels,
  dir = "rtl",
}: RichTextEditorProps) {
  const merged = React.useMemo(() => ({ ...defaultLabels, ...labels }), [labels]);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: buildEditorExtensions(placeholder ?? merged.placeholder, allowedEmbeds, dir),
    content: value,
    immediatelyRender: false, // SSR-safe
    editorProps: {
      attributes: { class: cx("bk-rich bk-editor-content", classNames?.content), dir, ...(id ? { id } : {}) },
    },
    onUpdate: ({ editor: e }) => onChangeRef.current(e.isEmpty ? "" : e.getHTML()),
  });

  // Keep in sync when the parent replaces the value (e.g. loading a different post).
  React.useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (value !== current) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  return (
    <LabelsContext.Provider value={merged}>
      <ClassNamesContext.Provider value={classNames ?? EMPTY}>
      <div className={cx("bk-editor", invalid && "bk-invalid", classNames?.root, className)} dir={dir}>
        {editor ? (
          <RichTextToolbar
            editor={editor}
            dir={dir}
            items={toolbar}
            allowedEmbeds={allowedEmbeds}
            uploadImage={uploadImage}
            mediaApi={mediaApi}
            renderMediaPicker={renderMediaPicker}
            resolveImageSrc={resolveImageSrc}
          />
        ) : null}
        <EditorContent editor={editor} />
      </div>
      </ClassNamesContext.Provider>
    </LabelsContext.Provider>
  );
}

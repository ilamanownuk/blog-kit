"use client";

import * as React from "react";
import { type Editor, useEditorState } from "@tiptap/react";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code2, Heading2, Heading3, Heading4,
  Highlighter, ImagePlus, Italic, Link2, Link2Off, List, ListOrdered, type LucideIcon, Minus,
  Palette, Quote, Redo2, Strikethrough, Table2, Underline, Undo2, Video,
} from "lucide-react";
import { type EmbedProvider, normalizeLinkUrl, toVideoEmbedUrl } from "../shared/embed";
import { ColorMenu } from "./color-menu";
import { ImageDialog } from "./image-dialog";
import { type Labels, useLabels } from "./labels";
import type { MediaApi, MediaPickerRenderProps, PickedImage } from "./types";
import { UrlDialog } from "./url-dialog";
import { Button } from "./ui";

type DialogKind = "link" | "video" | "image";

type ToolbarButton = {
  key: string;
  icon: LucideIcon;
  label: keyof Labels;
  isActive?: (editor: Editor) => boolean;
  isDisabled?: (editor: Editor) => boolean;
  run: (editor: Editor, openDialog: (kind: DialogKind) => void) => void;
};

const chain = (editor: Editor) => editor.chain().focus();

const GROUPS: ToolbarButton[][] = [
  [
    { key: "bold", icon: Bold, label: "bold", isActive: (e) => e.isActive("bold"), run: (e) => chain(e).toggleBold().run() },
    { key: "italic", icon: Italic, label: "italic", isActive: (e) => e.isActive("italic"), run: (e) => chain(e).toggleItalic().run() },
    { key: "underline", icon: Underline, label: "underline", isActive: (e) => e.isActive("underline"), run: (e) => chain(e).toggleUnderline().run() },
    { key: "strike", icon: Strikethrough, label: "strike", isActive: (e) => e.isActive("strike"), run: (e) => chain(e).toggleStrike().run() },
  ],
  [
    { key: "h2", icon: Heading2, label: "h2", isActive: (e) => e.isActive("heading", { level: 2 }), run: (e) => chain(e).toggleHeading({ level: 2 }).run() },
    { key: "h3", icon: Heading3, label: "h3", isActive: (e) => e.isActive("heading", { level: 3 }), run: (e) => chain(e).toggleHeading({ level: 3 }).run() },
    { key: "h4", icon: Heading4, label: "h4", isActive: (e) => e.isActive("heading", { level: 4 }), run: (e) => chain(e).toggleHeading({ level: 4 }).run() },
  ],
  [
    { key: "right", icon: AlignRight, label: "alignRight", isActive: (e) => e.isActive({ textAlign: "right" }), run: (e) => chain(e).setTextAlign("right").run() },
    { key: "center", icon: AlignCenter, label: "alignCenter", isActive: (e) => e.isActive({ textAlign: "center" }), run: (e) => chain(e).setTextAlign("center").run() },
    { key: "left", icon: AlignLeft, label: "alignLeft", isActive: (e) => e.isActive({ textAlign: "left" }), run: (e) => chain(e).setTextAlign("left").run() },
    { key: "justify", icon: AlignJustify, label: "alignJustify", isActive: (e) => e.isActive({ textAlign: "justify" }), run: (e) => chain(e).setTextAlign("justify").run() },
  ],
  [
    { key: "bullet", icon: List, label: "bulletList", isActive: (e) => e.isActive("bulletList"), run: (e) => chain(e).toggleBulletList().run() },
    { key: "ordered", icon: ListOrdered, label: "orderedList", isActive: (e) => e.isActive("orderedList"), run: (e) => chain(e).toggleOrderedList().run() },
    { key: "quote", icon: Quote, label: "quote", isActive: (e) => e.isActive("blockquote"), run: (e) => chain(e).toggleBlockquote().run() },
    { key: "code", icon: Code2, label: "codeBlock", isActive: (e) => e.isActive("codeBlock"), run: (e) => chain(e).toggleCodeBlock().run() },
    { key: "hr", icon: Minus, label: "hr", run: (e) => chain(e).setHorizontalRule().run() },
  ],
  [
    { key: "link", icon: Link2, label: "link", isActive: (e) => e.isActive("link"), run: (_e, open) => open("link") },
    { key: "unlink", icon: Link2Off, label: "unlink", isDisabled: (e) => !e.isActive("link"), run: (e) => chain(e).extendMarkRange("link").unsetLink().run() },
    { key: "image", icon: ImagePlus, label: "image", run: (_e, open) => open("image") },
    { key: "video", icon: Video, label: "video", run: (_e, open) => open("video") },
    { key: "table", icon: Table2, label: "table", isActive: (e) => e.isActive("table"), run: (e) => chain(e).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  ],
  [
    { key: "undo", icon: Undo2, label: "undo", isDisabled: (e) => !e.can().undo(), run: (e) => chain(e).undo().run() },
    { key: "redo", icon: Redo2, label: "redo", isDisabled: (e) => !e.can().redo(), run: (e) => chain(e).redo().run() },
  ],
];

const TABLE_ACTIONS: { key: string; label: keyof Labels; run: (editor: Editor) => void }[] = [
  { key: "row-after", label: "addRow", run: (e) => chain(e).addRowAfter().run() },
  { key: "col-after", label: "addColumn", run: (e) => chain(e).addColumnAfter().run() },
  { key: "row-delete", label: "deleteRow", run: (e) => chain(e).deleteRow().run() },
  { key: "col-delete", label: "deleteColumn", run: (e) => chain(e).deleteColumn().run() },
  { key: "table-delete", label: "deleteTable", run: (e) => chain(e).deleteTable().run() },
];

const ALL_BUTTONS = GROUPS.flat();

type ToolbarProps = {
  editor: Editor;
  dir: "rtl" | "ltr";
  allowedEmbeds: readonly EmbedProvider[];
  uploadImage?: (file: File) => Promise<PickedImage>;
  mediaApi?: MediaApi;
  renderMediaPicker?: (props: MediaPickerRenderProps) => React.ReactNode;
  resolveImageSrc?: (url: string) => string;
};

export function RichTextToolbar({ editor, dir, allowedEmbeds, ...imageProps }: ToolbarProps) {
  const labels = useLabels();
  const [dialog, setDialog] = React.useState<DialogKind | null>(null);

  // Only the state the buttons need; a transaction does not re-render everything.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      active: Object.fromEntries(ALL_BUTTONS.map((b) => [b.key, b.isActive?.(e) ?? false])),
      disabled: Object.fromEntries(ALL_BUTTONS.map((b) => [b.key, b.isDisabled?.(e) ?? false])),
      color: e.isActive("textStyle", { color: /.+/ }),
      highlight: e.isActive("highlight"),
      inTable: e.isActive("table"),
      href: (e.getAttributes("link").href as string | undefined) ?? "",
    }),
  });

  const closeDialog = (open: boolean) => !open && setDialog(null);

  return (
    <div className="bk-toolbar">
      {GROUPS.map((group, index) => (
        <React.Fragment key={group[0]!.key}>
          {index > 0 ? <span className="bk-sep" aria-hidden /> : null}
          {group.map((button) => {
            const label = labels[button.label];
            const active = state.active[button.key] ?? false;
            return (
              <Button
                key={button.key}
                size="icon"
                pressed={active}
                aria-label={label}
                title={label}
                aria-pressed={button.isActive ? active : undefined}
                disabled={state.disabled[button.key]}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => button.run(editor, setDialog)}
              >
                <button.icon size={16} />
              </Button>
            );
          })}
          {index === 0 ? (
            <>
              <ColorMenu editor={editor} mode="text" icon={Palette} active={state.color} />
              <ColorMenu editor={editor} mode="highlight" icon={Highlighter} active={state.highlight} />
            </>
          ) : null}
        </React.Fragment>
      ))}

      {state.inTable ? (
        <div className="bk-table-tools">
          {TABLE_ACTIONS.map((action) => (
            <Button key={action.key} variant="outline" size="sm" onMouseDown={(event) => event.preventDefault()} onClick={() => action.run(editor)}>
              {labels[action.label]}
            </Button>
          ))}
        </div>
      ) : null}

      <UrlDialog
        open={dialog === "link"}
        onOpenChange={closeDialog}
        dir={dir}
        title={labels.linkTitle}
        label={labels.linkField}
        placeholder={labels.linkPlaceholder}
        initialValue={state.href}
        errorMessage={labels.linkError}
        parse={normalizeLinkUrl}
        onSubmit={(href) => chain(editor).extendMarkRange("link").setLink({ href }).run()}
      />
      <UrlDialog
        open={dialog === "video"}
        onOpenChange={closeDialog}
        dir={dir}
        title={labels.videoTitle}
        label={labels.videoField}
        placeholder={labels.videoPlaceholder}
        errorMessage={labels.videoError}
        parse={(value) => toVideoEmbedUrl(value, allowedEmbeds)}
        onSubmit={(src) => chain(editor).insertContent({ type: "videoEmbed", attrs: { src } }).run()}
      />
      <ImageDialog
        {...imageProps}
        dir={dir}
        open={dialog === "image"}
        onOpenChange={closeDialog}
        onSubmit={(image) => chain(editor).setImage(image).run()}
      />
    </div>
  );
}

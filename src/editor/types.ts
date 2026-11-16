import type { ReactNode } from "react";
import type { EmbedProvider } from "../shared/embed";

export type MediaVariant = { url: string; width: number; height: number };

export type MediaItem = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  alt: string | null;
  /** Key = width ("320" is used for grid thumbnails). */
  variants: Record<string, MediaVariant>;
  createdAt: string;
};

export type MediaListResult = {
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
};

export type MediaUploadResult = { items: MediaItem[]; error?: string };

/** Contract for the built-in media picker; implement it with a server action / fetch in each app. */
export type MediaApi = {
  list: (params: { q?: string; page?: number }) => Promise<MediaListResult>;
  /** Receives FormData with the file under the `file` key. */
  upload: (formData: FormData) => Promise<MediaUploadResult>;
};

export type PickedImage = { url: string; alt?: string };

export type MediaPickerRenderProps = {
  onSelect: (image: PickedImage) => void;
  close: () => void;
};

export type { Labels } from "./labels";
export type { EditorClassNames } from "./ui";

/** Toolbar entries; "|" is a separator. */
export type ToolbarItem =
  | "bold" | "italic" | "underline" | "strike" | "textColor" | "highlight"
  | "h2" | "h3" | "h4"
  | "right" | "center" | "left" | "justify"
  | "bullet" | "ordered" | "quote" | "code" | "hr"
  | "link" | "unlink" | "image" | "video" | "table"
  | "undo" | "redo"
  | "|";

export type RichTextEditorProps = {
  /** HTML string. */
  value: string;
  /** Called with the HTML; an empty editor emits "". */
  onChange: (html: string) => void;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
  /** Extra class on the root element (same as `classNames.root`). */
  className?: string;
  /** Extra class names per part: root, toolbar, separator, button, content, tableTools, popover, dialog, input, label. Read once on mount for `content`. */
  classNames?: import("./ui").EditorClassNames;
  /** Which toolbar items to show, in order; "|" is a separator. Default: `defaultToolbar`. */
  toolbar?: readonly ToolbarItem[];
  /** Enables the "Upload" button in the image dialog. Throw / reject to show an error. */
  uploadImage?: (file: File) => Promise<PickedImage>;
  /** Built-in media library picker. */
  mediaApi?: MediaApi;
  /** Your own picker; takes precedence over `mediaApi`. */
  renderMediaPicker?: (props: MediaPickerRenderProps) => ReactNode;
  /** Maps an uploaded/library URL before insertion (e.g. to a 960px variant). */
  resolveImageSrc?: (url: string) => string;
  /** Default: aparat + youtube. Keep identical to the sanitizer option. */
  allowedEmbeds?: readonly EmbedProvider[];
  labels?: Partial<import("./labels").Labels>;
  dir?: "rtl" | "ltr";
};

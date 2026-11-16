"use client";

import * as React from "react";
import { ImagePlus, Images, Loader2 } from "lucide-react";
import { Button, Dialog, Input, Label } from "./ui";
import { useLabels } from "./labels";
import { MediaPicker } from "./media/media-picker";
import type { MediaApi, MediaPickerRenderProps, PickedImage } from "./types";

type ImageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (image: { src: string; alt: string }) => void;
  dir?: "rtl" | "ltr";
  uploadImage?: (file: File) => Promise<PickedImage>;
  mediaApi?: MediaApi;
  renderMediaPicker?: (props: MediaPickerRenderProps) => React.ReactNode;
  resolveImageSrc?: (url: string) => string;
};

const isHttps = (value: string) => /^https:\/\/\S+$/i.test(value);

export function ImageDialog({ open, onOpenChange, dir, ...form }: ImageDialogProps) {
  const labels = useLabels();
  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} title={labels.imageTitle} dir={dir}>
      <ImageForm {...form} dir={dir} onClose={() => onOpenChange(false)} />
    </Dialog>
  );
}

function ImageForm({
  onSubmit,
  onClose,
  dir,
  uploadImage,
  mediaApi,
  renderMediaPicker,
  resolveImageSrc,
}: Omit<ImageDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const labels = useLabels();
  const id = React.useId();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [src, setSrc] = React.useState("");
  const [alt, setAlt] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const applyPicked = (image: PickedImage) => {
    const url = resolveImageSrc ? resolveImageSrc(image.url) : image.url;
    if (!isHttps(url)) {
      setError(labels.imageHttpsError);
      return false;
    }
    setError(null);
    setSrc(url);
    if (image.alt && !alt) setAlt(image.alt);
    return true;
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !uploadImage) return;
    setUploading(true);
    setError(null);
    try {
      applyPicked(await uploadImage(file));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : labels.imageUploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const value = src.trim();
    if (!isHttps(value)) {
      setError(labels.imageHttpsError);
      return;
    }
    onSubmit({ src: value, alt: alt.trim() });
    onClose();
  };

  const hasLibrary = Boolean(renderMediaPicker || mediaApi);
  const closePicker = () => setPickerOpen(false);
  const onPicked = (image: PickedImage) => {
    if (applyPicked(image)) closePicker();
  };

  return (
    <>
    <form onSubmit={submit} className="bk-form">
      <h2 className="bk-dialog-title">{labels.imageTitle}</h2>
      {uploadImage || hasLibrary ? (
        <div className="bk-actions bk-actions-start">
          {uploadImage ? (
            <>
              <input ref={fileRef} type="file" accept="image/*" className="bk-sr-only" tabIndex={-1} onChange={handleFile} />
              <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 size={16} className="bk-spin" /> : <ImagePlus size={16} />}
                {uploading ? labels.imageUploading : labels.imageUpload}
              </Button>
            </>
          ) : null}
          {hasLibrary ? (
            <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <Images size={16} />
              {labels.imageLibrary}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="bk-field">
        <Label htmlFor={`${id}-src`}>{labels.imageUrl}</Label>
        <Input
          id={`${id}-src`}
          dir="ltr"
          value={src}
          placeholder={labels.imageUrlPlaceholder}
          onChange={(event) => setSrc(event.target.value)}
        />
      </div>
      {src && isHttps(src) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="bk-image-preview" />
      ) : null}
      <div className="bk-field">
        <Label htmlFor={`${id}-alt`}>{labels.imageAlt}</Label>
        <Input id={`${id}-alt`} value={alt} onChange={(event) => setAlt(event.target.value)} />
      </div>
      {error ? (
        <p role="alert" className="bk-error">
          {error}
        </p>
      ) : null}
      <div className="bk-dialog-footer">
        <Button variant="outline" onClick={onClose}>
          {labels.cancel}
        </Button>
        <Button variant="primary" type="submit" disabled={!src.trim() || uploading}>
          {labels.imageInsert}
        </Button>
      </div>
    </form>
      {pickerOpen ? (
        <div
          style={{ display: "contents" }}
          {...({
            onClose: (event: React.SyntheticEvent) => event.stopPropagation(),
            onCancel: (event: React.SyntheticEvent) => event.stopPropagation(),
          } as React.HTMLAttributes<HTMLDivElement>)}
          onKeyDown={(event) => event.key === "Escape" && event.stopPropagation()}
        >
          {renderMediaPicker ? (
            renderMediaPicker({ onSelect: onPicked, close: closePicker })
          ) : mediaApi ? (
            <MediaPicker api={mediaApi} dir={dir} onSelect={onPicked} onClose={closePicker} />
          ) : null}
        </div>
      ) : null}
    </>
  );
}

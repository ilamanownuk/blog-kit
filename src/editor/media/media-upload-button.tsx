"use client";

import * as React from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "../ui";
import { useLabels } from "../labels";
import type { MediaApi, MediaItem } from "../types";

type Props = { api: MediaApi; onUploaded: (item: MediaItem) => void };

/** File input -> api.upload -> first returned item is selected; errors shown inline (role=alert). */
export function MediaUploadButton({ api, onUploaded }: Props) {
  const labels = useLabels();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setBusy(true);
    setError(null);
    try {
      const result = await api.upload(formData);
      const item = result.items[0];
      if (result.error || !item) setError(result.error ?? labels.mediaUploadFailed);
      else onUploaded(item);
    } catch {
      setError(labels.mediaUploadFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bk-media-upload">
      <input
        ref={inputRef}
        type="file"
        className="bk-sr-only"
        tabIndex={-1}
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
      />
      <Button variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        <UploadCloud size={16} />
        {busy ? labels.imageUploading : labels.mediaUpload}
      </Button>
      {error ? (
        <p role="alert" className="bk-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

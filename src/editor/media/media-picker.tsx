"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button, Dialog, Input } from "../ui";
import { useLabels } from "../labels";
import type { MediaApi, MediaItem, PickedImage } from "../types";
import { MediaGrid } from "./media-grid";
import { MediaUploadButton } from "./media-upload-button";

type Props = {
  api: MediaApi;
  dir?: "rtl" | "ltr";
  onSelect: (image: PickedImage) => void;
  onClose: () => void;
};

const toPicked = (item: MediaItem): PickedImage => ({ url: item.url, alt: item.alt ?? undefined });

/** Built-in single-selection library dialog driven by `MediaApi`. */
export function MediaPicker({ api, dir, onSelect, onClose }: Props) {
  const labels = useLabels();
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState({ items: [] as MediaItem[], total: 0, pageSize: 24 });
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<MediaItem | null>(null);
  const requestId = React.useRef(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  React.useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    api
      .list({ q: debouncedQ || undefined, page })
      .then((result) => {
        if (id !== requestId.current) return;
        if (result.error) setError(result.error);
        else {
          setError(null);
          setData({ items: result.items, total: result.total, pageSize: result.pageSize || 24 });
        }
      })
      .catch(() => id === requestId.current && setError(labels.mediaLoadFailed))
      .finally(() => id === requestId.current && setLoading(false));
  }, [api, debouncedQ, page, labels.mediaLoadFailed]);

  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
  const Prev = dir === "ltr" ? ChevronLeft : ChevronRight;
  const Next = dir === "ltr" ? ChevronRight : ChevronLeft;

  return (
    <Dialog open onClose={onClose} title={labels.mediaTitle} dir={dir} wide>
      <header className="bk-dialog-header">
        <h2>{labels.mediaTitle}</h2>
        <Button size="icon" aria-label={labels.close} onClick={onClose}>
          <X size={16} />
        </Button>
      </header>
      <div className="bk-media-toolbar">
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={labels.mediaSearchPlaceholder}
          aria-label={labels.mediaSearch}
        />
        <MediaUploadButton api={api} onUploaded={(item) => onSelect(toPicked(item))} />
      </div>
      <div className="bk-media-body" aria-busy={loading}>
        {error ? (
          <p role="alert" className="bk-error">
            {error}
          </p>
        ) : (
          <MediaGrid items={data.items} selectedId={selected?.id ?? null} onSelect={setSelected} />
        )}
      </div>
      <footer className="bk-dialog-footer bk-media-footer">
        <div className="bk-pager">
          <Button variant="outline" size="icon" aria-label={labels.mediaPrevPage} disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <Prev size={16} />
          </Button>
          <span>
            {page} / {pageCount}
          </span>
          <Button variant="outline" size="icon" aria-label={labels.mediaNextPage} disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
            <Next size={16} />
          </Button>
        </div>
        <div className="bk-actions">
          <Button variant="outline" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button variant="primary" disabled={!selected} onClick={() => selected && onSelect(toPicked(selected))}>
            {labels.mediaSelect}
          </Button>
        </div>
      </footer>
    </Dialog>
  );
}

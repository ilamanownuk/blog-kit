import { Check } from "lucide-react";
import { cx } from "../ui";
import { useLabels } from "../labels";
import type { MediaItem } from "../types";

type Props = {
  items: MediaItem[];
  selectedId: string | null;
  onSelect: (item: MediaItem) => void;
};

export function MediaGrid({ items, selectedId, onSelect }: Props) {
  const labels = useLabels();
  if (!items.length) return <div className="bk-media-empty">{labels.mediaEmpty}</div>;
  return (
    <ul className="bk-media-grid">
      {items.map((item) => {
        const selected = item.id === selectedId;
        const thumb = item.variants["320"];
        return (
          <li key={item.id}>
            <button
              type="button"
              aria-pressed={selected}
              title={item.originalName}
              onClick={() => onSelect(item)}
              className={cx("bk-media-item", selected && "bk-selected")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb?.url ?? item.url} alt={item.alt ?? item.originalName} loading="lazy" />
              {selected ? (
                <span className="bk-media-check">
                  <Check size={16} />
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

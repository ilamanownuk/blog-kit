"use client";

import type { Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import { Button, Popover } from "./ui";
import { useLabels } from "./labels";

const TEXT_COLORS = ["#1c1c1c", "#997b2d", "#b91c1c", "#15803d", "#1d4ed8", "#7e22ce"];
const HIGHLIGHT_COLORS = ["#fde68a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff"];

type ColorMenuProps = { editor: Editor; mode: "text" | "highlight"; icon: LucideIcon; active: boolean };

const MODES = {
  text: {
    label: "textColor",
    colors: TEXT_COLORS,
    apply: (editor: Editor, color: string) => editor.chain().focus().setColor(color).run(),
    clear: (editor: Editor) => editor.chain().focus().unsetColor().run(),
  },
  highlight: {
    label: "highlight",
    colors: HIGHLIGHT_COLORS,
    apply: (editor: Editor, color: string) => editor.chain().focus().setHighlight({ color }).run(),
    clear: (editor: Editor) => editor.chain().focus().unsetHighlight().run(),
  },
} as const;

export function ColorMenu({ editor, mode, icon: Icon, active }: ColorMenuProps) {
  const labels = useLabels();
  const config = MODES[mode];
  const label = labels[config.label];
  return (
    <Popover
      trigger={({ onClick, open }) => (
        <Button
          size="icon"
          pressed={active}
          aria-label={label}
          title={label}
          aria-pressed={active}
          aria-expanded={open}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClick}
        >
          <Icon size={16} />
        </Button>
      )}
    >
      <div className="bk-colors">
        {config.colors.map((color) => (
          <button
            key={color}
            type="button"
            className="bk-swatch"
            style={{ backgroundColor: color }}
            aria-label={`${label} ${color}`}
            title={color}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => config.apply(editor, color)}
          />
        ))}
        <Button size="sm" onMouseDown={(event) => event.preventDefault()} onClick={() => config.clear(editor)}>
          {labels.remove}
        </Button>
      </div>
    </Popover>
  );
}

# Changelog

## 0.2.1

- Fix: Escape in a media picker (`renderMediaPicker` or the built-in one, native `<dialog>`) no longer also closes the image dialog; close/cancel events bubbling through the React tree are ignored by `Dialog` unless they come from the dialog itself, and the picker output is isolated from close/cancel/Escape.
- Docs: fixed the stale header comment in `styles.css` (it is unlayered; `styles.layered.css` is the layered one).

## 0.2.0

- Customization: every color, radius, font, spacing, shadow and z-index in `styles.css` is now a `--bk-*` variable with a default (new: `--bk-font-size`, `--bk-line-height`, `--bk-h2-size`..`--bk-h4-size`, `--bk-block-gap`, `--bk-media-radius`, `--bk-code-inline-bg`, `--bk-hr-color`, `--bk-table-*`, `--bk-backdrop`, `--bk-*-shadow`, `--bk-z-*`, dialog/toolbar sizing, optional `--bk-link`, `--bk-heading-color`, `--bk-quote-border`, `--bk-radius-sm/lg`, `--bk-focus-ring`).
- Dark theme preset: `[data-bk-theme="dark"]`, `.dark`, and `data-bk-theme="auto"` (follows the OS).
- `RichTextEditor`: new `classNames` prop (root, toolbar, separator, button, content, tableTools, popover, dialog, input, label) and `toolbar` prop (choose / reorder items, `"|"` separator). Exports `defaultToolbar`, `ToolbarItem`, `EditorClassNames`. Defaults are unchanged.
- New `styles.layered.css` export: same rules inside `@layer blog-kit`, so plain consumer CSS / Tailwind utilities win. `styles.css` stays unlayered so the default look is unchanged.
- Docs: README rewritten in Persian; new `AI_INSTALL_PROMPT.md` (shipped in the package) for AI-assisted installation.

## 0.1.0

- Initial release: Tiptap editor, Aparat/YouTube embeds, image upload, media library picker, server sanitizer, renderer.

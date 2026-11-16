"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ghost" | "outline" | "primary";
  size?: "icon" | "sm" | "md";
  pressed?: boolean;
};

export function Button({ variant = "ghost", size = "md", pressed, className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("bk-btn", `bk-btn-${variant}`, `bk-btn-${size}`, pressed && "bk-pressed", className)}
      {...rest}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx("bk-input", props.className)} />;
}

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cx("bk-label", props.className)} />;
}

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  dir?: "rtl" | "ltr";
  wide?: boolean;
  children: React.ReactNode;
};

/** Native <dialog> rendered into document.body (never nested inside a consumer's <form>). */
export function Dialog({ open, ...rest }: DialogProps) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(<DialogShell {...rest} />, document.body);
}

function DialogShell({ onClose, title, dir, wide, children }: Omit<DialogProps, "open">) {
  const ref = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      dir={dir}
      aria-label={title}
      className={cx("bk-dialog", wide && "bk-dialog-wide")}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="bk-dialog-body">{children}</div>
    </dialog>
  );
}

type PopoverProps = {
  trigger: (props: { onClick: () => void; open: boolean }) => React.ReactNode;
  children: React.ReactNode;
};

export function Popover({ trigger, children }: PopoverProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <span ref={ref} className="bk-popover">
      {trigger({ onClick: () => setOpen((value) => !value), open })}
      {open ? <div className="bk-popover-content">{children}</div> : null}
    </span>
  );
}

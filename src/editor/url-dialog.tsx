"use client";

import * as React from "react";
import { Button, Dialog, Input, Label } from "./ui";
import { useLabels } from "./labels";

type UrlDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  placeholder: string;
  initialValue?: string;
  errorMessage: string;
  dir?: "rtl" | "ltr";
  /** Normalized URL, or null for invalid input. */
  parse: (value: string) => string | null;
  onSubmit: (url: string) => void;
};

/** Asks for a URL (link / video); invalid input is never inserted. */
export function UrlDialog({ open, onOpenChange, ...form }: UrlDialogProps) {
  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} title={form.title} dir={form.dir}>
      <UrlForm {...form} onClose={() => onOpenChange(false)} />
    </Dialog>
  );
}

function UrlForm({
  title,
  label,
  placeholder,
  initialValue = "",
  errorMessage,
  parse,
  onSubmit,
  onClose,
}: Omit<UrlDialogProps, "open" | "onOpenChange" | "dir"> & { onClose: () => void }) {
  const labels = useLabels();
  const id = React.useId();
  const [value, setValue] = React.useState(initialValue);
  const [error, setError] = React.useState<string | null>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    // React events bubble through the portal to a surrounding app <form>; never submit that one.
    event.stopPropagation();
    const url = parse(value);
    if (!url) {
      setError(errorMessage);
      return;
    }
    onSubmit(url);
    onClose();
  };

  return (
    <form onSubmit={submit} className="bk-form">
      <h2 className="bk-dialog-title">{title}</h2>
      <div className="bk-field">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          dir="ltr"
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          autoFocus
        />
        {error ? (
          <p role="alert" className="bk-error">
            {error}
          </p>
        ) : null}
      </div>
      <div className="bk-dialog-footer">
        <Button variant="outline" onClick={onClose}>
          {labels.cancel}
        </Button>
        <Button variant="primary" type="submit">
          {labels.insert}
        </Button>
      </div>
    </form>
  );
}

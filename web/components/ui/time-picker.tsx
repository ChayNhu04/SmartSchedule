"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  /** Value in `HH:mm` (24-hour). Empty string means unset. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  ariaLabel?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]?\d)$/;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Normalize input string to `HH:mm` (24h) or empty if invalid. */
function normalize(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();

  // Accept `HHMM` shorthand: 4 digits, no separator.
  const compact = trimmed.match(/^(\d{2})(\d{2})$/);
  if (compact) {
    const h = parseInt(compact[1] ?? "", 10);
    const m = parseInt(compact[2] ?? "", 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${pad2(h)}:${pad2(m)}`;
    }
    return "";
  }

  const match = trimmed.match(TIME_RE);
  if (!match) return "";
  const h = parseInt(match[1] ?? "", 10);
  const m = parseInt(match[2] ?? "", 10);
  return `${pad2(h)}:${pad2(m)}`;
}

/**
 * Locale-independent time input pinned to 24-hour `HH:mm`. Replaces the native
 * `<input type="time">` which can render as 12-hour (AM/PM) depending on the
 * user's browser locale.
 *
 * Accepts both `H:mm` / `HH:mm` typed entry and a `HHMM` 4-digit shorthand
 * (e.g. `0930`). Auto-inserts the colon after the 2nd digit while typing and
 * normalizes to `HH:mm` on blur.
 */
export function TimePicker({
  value,
  onChange,
  id,
  ariaLabel,
  required,
  className,
  disabled,
}: TimePickerProps) {
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Strip everything except digits and colon for predictable typing.
    const cleaned = raw.replace(/[^\d:]/g, "").slice(0, 5);
    // Auto-insert colon after 2 digits if user hasn't typed one yet.
    const withColon =
      cleaned.length >= 3 && !cleaned.includes(":")
        ? `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`
        : cleaned;
    setDraft(withColon);
  };

  const handleBlur = () => {
    const normalized = normalize(draft);
    setDraft(normalized);
    onChange(normalized);
  };

  return (
    <div
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={ariaLabel}
        aria-required={required}
        placeholder="HH:mm"
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        required={required}
        disabled={disabled}
        className="w-full bg-transparent py-2 text-base placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed md:text-sm"
      />
    </div>
  );
}

"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  /** Value in `YYYY-MM-DD` (local). Empty string means unset. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  ariaLabel?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

const STORAGE_FORMAT = "yyyy-MM-dd";
const DISPLAY_FORMAT = "dd/MM/yyyy";

function parseStorage(value: string): Date | null {
  if (!value) return null;
  const d = parse(value, STORAGE_FORMAT, new Date());
  return isValid(d) ? d : null;
}

function toStorage(date: Date): string {
  return format(date, STORAGE_FORMAT);
}

/**
 * Locale-independent date picker that always displays `dd/MM/yyyy` in Vietnamese
 * regardless of the user's browser locale, replacing the native
 * `<input type="date">` whose format we cannot control across browsers.
 *
 * Internally stores the value as `YYYY-MM-DD` so callers can use the same
 * `combineDateTime(date, time)` helpers that pair this with the time picker.
 */
export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "dd/mm/yyyy",
  ariaLabel,
  required,
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseStorage(value);
  const displayLabel = selected ? format(selected, DISPLAY_FORMAT, { locale: vi }) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={ariaLabel}
          aria-required={required}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start gap-2 font-normal",
            !displayLabel && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{displayLabel || placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <Calendar
          mode="single"
          selected={selected ?? undefined}
          defaultMonth={selected ?? undefined}
          onSelect={(d) => {
            if (d) {
              onChange(toStorage(d));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

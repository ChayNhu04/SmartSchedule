"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { vi } from "date-fns/locale";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Wrapper around react-day-picker pinning Vietnamese locale and Monday as the
 * first day of the week. Uses the library's default stylesheet with a few
 * CSS-variable overrides defined in `globals.css` to align with the app theme.
 */
export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={vi}
      weekStartsOn={1}
      showOutsideDays
      className={cn("rdp-app", className)}
      classNames={{
        caption_label: "rdp-caption-label-app",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...rest }) => {
          const Icon = orientation === "right" ? ChevronRight : ChevronLeft;
          return <Icon className="size-4" {...rest} />;
        },
      }}
      {...props}
    />
  );
}

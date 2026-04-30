import { cn } from "@/lib/utils";
import {
  PRIORITY_BADGE_CLASS,
  PRIORITY_DOT_CLASS,
  PRIORITY_LABEL,
} from "@/lib/priority";
import type { SchedulePriority } from "@smartschedule/shared";

interface Props {
  priority: SchedulePriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        PRIORITY_BADGE_CLASS[priority],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT_CLASS[priority])} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

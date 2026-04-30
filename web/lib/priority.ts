import type { SchedulePriority } from "@smartschedule/shared";

export const PRIORITY_LABEL: Record<SchedulePriority, string> = {
  low: "Thấp",
  normal: "Vừa",
  high: "Cao",
};

export const PRIORITY_BAR_CLASS: Record<SchedulePriority, string> = {
  low: "bg-priority-low",
  normal: "bg-priority-normal",
  high: "bg-priority-high",
};

export const PRIORITY_BADGE_CLASS: Record<SchedulePriority, string> = {
  low: "bg-priority-low/10 text-priority-low border-priority-low/20",
  normal: "bg-priority-normal/10 text-priority-normal border-priority-normal/20",
  high: "bg-priority-high/10 text-priority-high border-priority-high/20",
};

export const PRIORITY_DOT_CLASS: Record<SchedulePriority, string> = {
  low: "bg-priority-low",
  normal: "bg-priority-normal",
  high: "bg-priority-high",
};

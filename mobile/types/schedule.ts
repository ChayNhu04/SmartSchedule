export type SchedulePriority = "low" | "normal" | "high";
export type ScheduleStatus = "pending" | "completed" | "cancelled";
export type ScheduleItemType = "task" | "meeting" | "event" | "reminder";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly";

export interface Schedule {
  id: number;
  user_id: string;
  item_type: ScheduleItemType;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  status: ScheduleStatus;
  priority: SchedulePriority;
  remind_at: string | null;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_until: string | null;
  created_at: string;
  updated_at: string;
}

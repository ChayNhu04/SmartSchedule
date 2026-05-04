// Shared TypeScript types & enums dùng chung giữa backend / web / mobile.
// Chỉ chứa type — không có runtime code để các consumer (RN, Next, Nest) đều import được.

export type SchedulePriority = 'low' | 'normal' | 'high';
export type ScheduleStatus = 'pending' | 'completed' | 'cancelled';
export type ScheduleItemType = 'task' | 'meeting' | 'event' | 'reminder';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export const PRIORITIES: SchedulePriority[] = ['low', 'normal', 'high'];
export const STATUSES: ScheduleStatus[] = ['pending', 'completed', 'cancelled'];
export const ITEM_TYPES: ScheduleItemType[] = ['task', 'meeting', 'event', 'reminder'];
export const RECURRENCES: RecurrenceType[] = ['none', 'daily', 'weekly', 'monthly'];

export const PRIORITY_FLAG: Record<SchedulePriority, string> = {
  low: '🟢',
  normal: '🟡',
  high: '🔴',
};

export const PRIORITY_LABEL_VI: Record<SchedulePriority, string> = {
  low: 'Thấp',
  normal: 'Vừa',
  high: 'Cao',
};

export const ITEM_TYPE_LABEL_VI: Record<ScheduleItemType, string> = {
  task: 'Công việc',
  meeting: 'Cuộc họp',
  event: 'Sự kiện',
  reminder: 'Nhắc nhở',
};

export const RECURRENCE_LABEL_VI: Record<RecurrenceType, string> = {
  none: 'Không lặp',
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
};

export interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
}

export interface UserSettings {
  user_id: string;
  timezone: string;
  default_remind_minutes: number;
  notify_via_push: boolean;
  work_start_hour: number;
  work_end_hour: number;
}

export interface Tag {
  id: number;
  user_id: string;
  name: string;
  color: string | null;
}

export interface Schedule {
  id: number;
  user_id: string;
  item_type: ScheduleItemType;
  title: string;
  description: string | null;
  start_time: string; // ISO 8601
  end_time: string | null;
  status: ScheduleStatus;
  priority: SchedulePriority;
  remind_at: string | null;
  is_reminded: boolean;
  acknowledged_at: string | null;
  end_notified_at: string | null;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_until: string | null;
  recurrence_parent_id: number | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface ScheduleTemplate {
  id: number;
  user_id: string;
  name: string;
  item_type: ScheduleItemType;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  default_remind_minutes: number | null;
  priority: SchedulePriority;
}

export type AuditAction =
  | 'create'
  | 'update'
  | 'complete'
  | 'cancel'
  | 'delete'
  | 'restore'
  | 'share-add'
  | 'share-remove'
  | 'tag-add'
  | 'tag-remove';

export interface ScheduleAuditLog {
  id: string;
  schedule_id: number;
  user_id: string;
  action: AuditAction;
  changes: Record<string, { from?: unknown; to?: unknown }> | null;
  created_at: string;
}

// ===== Auth API contracts =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  display_name?: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

// ===== Schedule API contracts =====
export interface CreateScheduleRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  remind_at?: string;
  item_type?: ScheduleItemType;
  priority?: SchedulePriority;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  recurrence_until?: string;
}

export type UpdateScheduleRequest = Partial<CreateScheduleRequest> & {
  status?: ScheduleStatus;
  is_reminded?: boolean;
};

export interface ScheduleStats {
  total: number;
  completed: number;
  completionRate: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
}

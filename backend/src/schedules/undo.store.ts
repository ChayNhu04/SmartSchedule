import { Injectable } from '@nestjs/common';
import { Schedule, ScheduleStatus } from './entities/schedule.entity';

/**
 * In-memory undo store: giữ snapshot tối đa 10 phút cho mỗi user.
 * Hỗ trợ revert action gần nhất (delete | complete).
 *
 * Không persist sang restart — chấp nhận trade-off cho MVP.
 */
export type UndoActionType = 'delete' | 'complete';

export interface UndoEntry {
  action: UndoActionType;
  /**
   * Bản sao lịch tại thời điểm trước action.
   * - delete: dùng để re-create.
   * - complete: dùng để revert status + acknowledged_at.
   */
  snapshot: Schedule;
  createdAt: number;
}

export const UNDO_TTL_MS = 10 * 60 * 1000;
export const UNDO_MAX_PER_USER = 20;

@Injectable()
export class UndoStore {
  private byUser = new Map<string, UndoEntry[]>();

  push(userId: string, entry: Omit<UndoEntry, 'createdAt'>): void {
    const stack = this.byUser.get(userId) ?? [];
    stack.push({ ...entry, createdAt: Date.now() });
    if (stack.length > UNDO_MAX_PER_USER) {
      stack.shift();
    }
    this.byUser.set(userId, stack);
  }

  /**
   * Lấy entry gần nhất còn trong TTL (không pop).
   */
  peek(userId: string, now: number = Date.now()): UndoEntry | null {
    const stack = this.byUser.get(userId);
    if (!stack || stack.length === 0) return null;
    const last = stack[stack.length - 1];
    if (now - last.createdAt > UNDO_TTL_MS) return null;
    return last;
  }

  /**
   * Pop entry gần nhất nếu còn TTL. Trả null nếu không có hoặc đã hết hạn.
   */
  pop(userId: string, now: number = Date.now()): UndoEntry | null {
    const stack = this.byUser.get(userId);
    if (!stack || stack.length === 0) return null;
    const last = stack[stack.length - 1];
    if (now - last.createdAt > UNDO_TTL_MS) {
      // Cleanup luôn — entry đã hết hạn.
      this.cleanupForUser(userId, now);
      return null;
    }
    stack.pop();
    if (stack.length === 0) this.byUser.delete(userId);
    return last;
  }

  /**
   * Drop tất cả entry hết hạn của 1 user.
   */
  private cleanupForUser(userId: string, now: number): void {
    const stack = this.byUser.get(userId);
    if (!stack) return;
    const fresh = stack.filter((e) => now - e.createdAt <= UNDO_TTL_MS);
    if (fresh.length === 0) {
      this.byUser.delete(userId);
    } else {
      this.byUser.set(userId, fresh);
    }
  }

  /**
   * Sweep tất cả user — gọi từ cron mỗi phút.
   */
  cleanup(now: number = Date.now()): number {
    let dropped = 0;
    for (const [userId, stack] of this.byUser.entries()) {
      const before = stack.length;
      const fresh = stack.filter((e) => now - e.createdAt <= UNDO_TTL_MS);
      dropped += before - fresh.length;
      if (fresh.length === 0) {
        this.byUser.delete(userId);
      } else if (fresh.length !== before) {
        this.byUser.set(userId, fresh);
      }
    }
    return dropped;
  }

  /**
   * Cho test: reset toàn bộ store.
   */
  reset(): void {
    this.byUser.clear();
  }

  /**
   * Snapshot Schedule plain object — không kéo theo TypeORM relation lazy load.
   * Chỉ giữ field cần để re-create / revert.
   */
  static cloneSchedule(s: Schedule): Schedule {
    const copy = new Schedule();
    Object.assign(copy, {
      id: s.id,
      user_id: s.user_id,
      item_type: s.item_type,
      title: s.title,
      description: s.description,
      start_time: s.start_time ? new Date(s.start_time) : s.start_time,
      end_time: s.end_time ? new Date(s.end_time) : null,
      status: s.status as ScheduleStatus,
      priority: s.priority,
      remind_at: s.remind_at ? new Date(s.remind_at) : null,
      is_reminded: s.is_reminded,
      acknowledged_at: s.acknowledged_at ? new Date(s.acknowledged_at) : null,
      end_notified_at: s.end_notified_at ? new Date(s.end_notified_at) : null,
      recurrence_type: s.recurrence_type,
      recurrence_interval: s.recurrence_interval,
      recurrence_until: s.recurrence_until ? new Date(s.recurrence_until) : null,
      recurrence_parent_id: s.recurrence_parent_id,
      created_at: s.created_at,
      updated_at: s.updated_at,
    });
    return copy;
  }
}

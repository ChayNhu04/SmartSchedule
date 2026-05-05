import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Schedule, SchedulePriority } from './entities/schedule.entity';
import { CreateScheduleDto, QueryScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { AuditService } from '../audit/audit.service';
import { UndoStore } from './undo.store';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule) private readonly repo: Repository<Schedule>,
    private readonly audit: AuditService,
    private readonly undoStore: UndoStore,
  ) {}

  async create(userId: string, dto: CreateScheduleDto): Promise<Schedule> {
    const entity = this.repo.create({
      user_id: userId,
      item_type: dto.item_type ?? 'task',
      title: dto.title,
      description: dto.description ?? null,
      start_time: new Date(dto.start_time),
      end_time: dto.end_time ? new Date(dto.end_time) : null,
      remind_at: dto.remind_at ? new Date(dto.remind_at) : null,
      priority: dto.priority ?? 'normal',
      recurrence_type: dto.recurrence_type ?? 'none',
      recurrence_interval: dto.recurrence_interval ?? 1,
      recurrence_until: dto.recurrence_until ? new Date(dto.recurrence_until) : null,
    });
    const saved = await this.repo.save(entity);
    await this.audit.log(saved.id, userId, 'create');
    return saved;
  }

  async findOne(userId: string, id: number): Promise<Schedule> {
    const s = await this.repo.findOne({
      where: { id, user_id: userId },
      relations: ['tags'],
    });
    if (!s) throw new NotFoundException('Không tìm thấy lịch');
    return s;
  }

  async list(userId: string, q: QueryScheduleDto) {
    const where: Record<string, unknown> = { user_id: userId };
    if (q.status) where.status = q.status;
    if (q.priority) where.priority = q.priority as SchedulePriority;
    if (q.from || q.to) {
      where.start_time = Between(
        q.from ? new Date(q.from) : new Date(0),
        q.to ? new Date(q.to) : new Date('2999-12-31'),
      );
    }
    const limit = q.limit ?? 20;
    const offset = q.offset ?? 0;
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { start_time: 'ASC', id: 'ASC' },
      take: limit,
      skip: offset,
      relations: ['tags'],
    });
    return { items, total, limit, offset };
  }

  today(userId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return this.repo.find({
      where: { user_id: userId, start_time: Between(start, end) },
      order: { start_time: 'ASC' },
      relations: ['tags'],
    });
  }

  async upcoming(userId: string, limit = 5, tagId?: number) {
    const items = await this.repo.find({
      where: { user_id: userId, status: 'pending', start_time: MoreThanOrEqual(new Date()) },
      order: { start_time: 'ASC' },
      take: tagId ? Math.max(limit * 5, 100) : limit,
      relations: ['tags'],
    });
    if (!tagId) return items;
    return items.filter((s) => s.tags?.some((t) => t.id === tagId)).slice(0, limit);
  }

  overdue(userId: string) {
    return this.repo.find({
      where: { user_id: userId, status: 'pending', start_time: LessThan(new Date()) },
      order: { start_time: 'ASC' },
      relations: ['tags'],
    });
  }

  search(userId: string, keyword: string) {
    if (!keyword) return [];
    const pattern = `%${keyword}%`;
    return this.repo.find({
      where: [
        { user_id: userId, title: ILike(pattern) },
        { user_id: userId, description: ILike(pattern) },
      ],
      order: { start_time: 'ASC' },
      take: 50,
    });
  }

  allForExport(userId: string) {
    return this.repo.find({
      where: { user_id: userId },
      order: { start_time: 'ASC' },
    });
  }

  async stats(userId: string, range?: string) {
    const since = new Date();
    if (range === 'tuan') since.setDate(since.getDate() - 7);
    else if (range === 'thang') since.setMonth(since.getMonth() - 1);
    else if (range === 'nam') since.setFullYear(since.getFullYear() - 1);
    else since.setDate(since.getDate() - 30);

    const all = await this.repo.find({
      where: { user_id: userId, start_time: MoreThanOrEqual(since) },
    });
    const total = all.length;
    const completed = all.filter((s) => s.status === 'completed').length;
    return {
      total,
      completed,
      completionRate: total ? completed / total : 0,
      byPriority: this.groupBy(all, (s) => s.priority),
      byType: this.groupBy(all, (s) => s.item_type),
    };
  }

  async update(userId: string, id: number, dto: UpdateScheduleDto): Promise<Schedule> {
    const existing = await this.findOne(userId, id);
    Object.assign(existing, {
      ...dto,
      start_time: dto.start_time ? new Date(dto.start_time) : existing.start_time,
      end_time: dto.end_time ? new Date(dto.end_time) : existing.end_time,
      remind_at: dto.remind_at ? new Date(dto.remind_at) : existing.remind_at,
      recurrence_until: dto.recurrence_until
        ? new Date(dto.recurrence_until)
        : existing.recurrence_until,
    });
    const saved = await this.repo.save(existing);
    await this.audit.log(id, userId, 'update');
    return saved;
  }

  async complete(userId: string, id: number): Promise<Schedule> {
    const s = await this.findOne(userId, id);
    this.undoStore.push(userId, {
      action: 'complete',
      snapshot: UndoStore.cloneSchedule(s),
    });
    s.status = 'completed';
    s.acknowledged_at = new Date();
    const saved = await this.repo.save(s);
    await this.audit.log(id, userId, 'complete');
    return saved;
  }

  async remove(userId: string, id: number): Promise<{ ok: true }> {
    const s = await this.findOne(userId, id);
    this.undoStore.push(userId, {
      action: 'delete',
      snapshot: UndoStore.cloneSchedule(s),
    });
    await this.repo.remove(s);
    await this.audit.log(id, userId, 'delete');
    return { ok: true };
  }

  /**
   * Pop entry undo gần nhất và revert.
   * - delete: re-insert lịch (giữ nguyên id nếu DB cho phép, nếu không thì id mới).
   * - complete: revert status về snapshot.status + acknowledged_at = null.
   */
  async undoLast(userId: string): Promise<{ action: 'delete' | 'complete'; schedule: Schedule }> {
    const entry = this.undoStore.pop(userId);
    if (!entry) {
      throw new BadRequestException('Không có thao tác nào để hoàn tác (giới hạn 10 phút).');
    }
    const snap = entry.snapshot;
    if (entry.action === 'delete') {
      const restored = this.repo.create({
        user_id: snap.user_id,
        item_type: snap.item_type,
        title: snap.title,
        description: snap.description,
        start_time: snap.start_time,
        end_time: snap.end_time,
        status: snap.status,
        priority: snap.priority,
        remind_at: snap.remind_at,
        is_reminded: snap.is_reminded,
        acknowledged_at: snap.acknowledged_at,
        end_notified_at: snap.end_notified_at,
        recurrence_type: snap.recurrence_type,
        recurrence_interval: snap.recurrence_interval,
        recurrence_until: snap.recurrence_until,
        recurrence_parent_id: snap.recurrence_parent_id,
      });
      const saved = await this.repo.save(restored);
      await this.audit.log(saved.id, userId, 'restore');
      return { action: 'delete', schedule: saved };
    }
    const existing = await this.repo.findOne({ where: { id: snap.id, user_id: userId } });
    if (!existing) {
      throw new BadRequestException('Lịch đã không còn tồn tại.');
    }
    existing.status = snap.status;
    existing.acknowledged_at = snap.acknowledged_at;
    const saved = await this.repo.save(existing);
    await this.audit.log(saved.id, userId, 'restore');
    return { action: 'complete', schedule: saved };
  }

  /**
   * Trả thông tin entry gần nhất (cho UI ẩn/hiện nút Hoàn tác).
   */
  peekUndo(userId: string): { action: 'delete' | 'complete'; title: string; expiresAt: number } | null {
    const entry = this.undoStore.peek(userId);
    if (!entry) return null;
    return {
      action: entry.action,
      title: entry.snapshot.title,
      expiresAt: entry.createdAt + 10 * 60 * 1000,
    };
  }

  private groupBy<T>(arr: T[], key: (x: T) => string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const x of arr) {
      const k = key(x);
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }
}

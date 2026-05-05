import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Schedule, SchedulePriority } from './entities/schedule.entity';
import { CreateScheduleDto, QueryScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule) private readonly repo: Repository<Schedule>,
    private readonly audit: AuditService,
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
    s.status = 'completed';
    s.acknowledged_at = new Date();
    const saved = await this.repo.save(s);
    await this.audit.log(id, userId, 'complete');
    return saved;
  }

  async remove(userId: string, id: number): Promise<{ ok: true }> {
    const s = await this.findOne(userId, id);
    await this.repo.remove(s);
    await this.audit.log(id, userId, 'delete');
    return { ok: true };
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

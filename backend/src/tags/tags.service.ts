import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { CreateTagDto } from './dto/tag.dto';

const NAME_RE = /^[a-z0-9_-]+$/;

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag) private readonly tags: Repository<Tag>,
    @InjectRepository(Schedule) private readonly schedules: Repository<Schedule>,
  ) {}

  static normalize(name: string): string {
    return name.trim().toLowerCase();
  }

  list(userId: string) {
    return this.tags.find({ where: { user_id: userId }, order: { name: 'ASC' } });
  }

  async create(userId: string, dto: CreateTagDto): Promise<Tag> {
    const name = TagsService.normalize(dto.name);
    if (!NAME_RE.test(name) || name.length > 30) {
      throw new BadRequestException('Tên tag chỉ chứa a-z, 0-9, -, _ và ≤30 ký tự');
    }
    const existing = await this.tags.findOne({ where: { user_id: userId, name } });
    if (existing) return existing;
    return this.tags.save(this.tags.create({ user_id: userId, name, color: dto.color ?? null }));
  }

  async remove(userId: string, rawName: string): Promise<{ ok: true }> {
    const name = TagsService.normalize(rawName);
    await this.tags.delete({ user_id: userId, name });
    return { ok: true };
  }

  async attach(userId: string, scheduleId: number, names: string[]): Promise<Schedule> {
    const schedule = await this.schedules.findOne({
      where: { id: scheduleId, user_id: userId },
      relations: ['tags'],
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch');
    const tags: Tag[] = [];
    for (const raw of names) {
      tags.push(await this.create(userId, { name: raw }));
    }
    const set = new Map<number, Tag>();
    for (const t of [...(schedule.tags ?? []), ...tags]) set.set(t.id, t);
    schedule.tags = [...set.values()];
    return this.schedules.save(schedule);
  }

  async detach(userId: string, scheduleId: number, rawName: string): Promise<Schedule> {
    const name = TagsService.normalize(rawName);
    const schedule = await this.schedules.findOne({
      where: { id: scheduleId, user_id: userId },
      relations: ['tags'],
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch');
    schedule.tags = (schedule.tags ?? []).filter((t) => t.name !== name);
    return this.schedules.save(schedule);
  }

  async findSchedulesByTag(userId: string, rawName: string): Promise<Schedule[]> {
    const name = TagsService.normalize(rawName);
    return this.schedules
      .createQueryBuilder('s')
      .innerJoin('s.tags', 't')
      .where('s.user_id = :userId AND t.name = :name', { userId, name })
      .orderBy('s.start_time', 'ASC')
      .getMany();
  }
}

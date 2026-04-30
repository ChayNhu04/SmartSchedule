import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleTemplate } from './entities/schedule-template.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { CreateTemplateDto, InstantiateTemplateDto } from './dto/template.dto';

const NAME_RE = /^[a-z0-9_-]+$/;

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(ScheduleTemplate) private readonly tpl: Repository<ScheduleTemplate>,
    @InjectRepository(Schedule) private readonly schedules: Repository<Schedule>,
  ) {}

  private static normalize(name: string): string {
    return name.trim().toLowerCase();
  }

  list(userId: string) {
    return this.tpl.find({ where: { user_id: userId }, order: { name: 'ASC' } });
  }

  async create(userId: string, dto: CreateTemplateDto): Promise<ScheduleTemplate> {
    const name = TemplatesService.normalize(dto.name);
    if (!NAME_RE.test(name) || name.length > 50) {
      throw new BadRequestException('Tên template không hợp lệ');
    }
    const exists = await this.tpl.findOne({ where: { user_id: userId, name } });
    if (exists) throw new BadRequestException('Template đã tồn tại');
    return this.tpl.save(
      this.tpl.create({
        user_id: userId,
        name,
        item_type: dto.item_type ?? 'task',
        title: dto.title,
        description: dto.description ?? null,
        duration_minutes: dto.duration_minutes ?? null,
        default_remind_minutes: dto.default_remind_minutes ?? null,
        priority: dto.priority ?? 'normal',
      }),
    );
  }

  async remove(userId: string, rawName: string): Promise<{ ok: true }> {
    const name = TemplatesService.normalize(rawName);
    await this.tpl.delete({ user_id: userId, name });
    return { ok: true };
  }

  async instantiate(
    userId: string,
    rawName: string,
    dto: InstantiateTemplateDto,
  ): Promise<Schedule> {
    const name = TemplatesService.normalize(rawName);
    const t = await this.tpl.findOne({ where: { user_id: userId, name } });
    if (!t) throw new NotFoundException('Template không tồn tại');

    const start = new Date(dto.start_time);
    const end = t.duration_minutes
      ? new Date(start.getTime() + t.duration_minutes * 60_000)
      : null;
    const remind = t.default_remind_minutes
      ? new Date(start.getTime() - t.default_remind_minutes * 60_000)
      : null;

    return this.schedules.save(
      this.schedules.create({
        user_id: userId,
        item_type: t.item_type,
        title: t.title,
        description: t.description,
        start_time: start,
        end_time: end,
        remind_at: remind,
        priority: t.priority,
      }),
    );
  }
}

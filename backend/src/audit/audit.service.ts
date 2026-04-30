import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditChanges, ScheduleAuditLog } from './entities/schedule-audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(ScheduleAuditLog)
    private readonly repo: Repository<ScheduleAuditLog>,
  ) {}

  async log(
    schedule_id: number,
    user_id: string,
    action: AuditAction,
    changes: AuditChanges = null,
  ): Promise<void> {
    await this.repo.save(this.repo.create({ schedule_id, user_id, action, changes }));
  }

  history(scheduleId: number, userId: string, limit = 20, offset = 0) {
    return this.repo.findAndCount({
      where: { schedule_id: scheduleId, user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}

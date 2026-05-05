import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { Schedule } from '../schedules/entities/schedule.entity';
import { PushService } from './push.service';
import {
  isInsideWorkHours,
  isWorkHoursConfigured,
  nextWorkStart,
  WorkHoursSettings,
} from './work-hours';

const DEFAULT_REPEAT_MINUTES = 30;

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);
  private running = false;

  constructor(
    @InjectRepository(Schedule) private readonly schedules: Repository<Schedule>,
    private readonly push: PushService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const now = new Date();
      await this.processStart(now);
      await this.processEnd(now);
    } finally {
      this.running = false;
    }
  }

  private async processStart(now: Date): Promise<void> {
    const due = await this.schedules.find({
      where: {
        remind_at: LessThanOrEqual(now),
        acknowledged_at: IsNull(),
        status: 'pending',
      },
      relations: ['user', 'user.settings'],
      order: { remind_at: 'ASC' },
      take: 100,
    });
    if (due.length === 0) return;
    this.logger.log(`🔔 ${due.length} start-reminder(s) cần gửi`);

    for (const s of due) {
      const settings = s.user?.settings;
      const repeat = settings?.default_remind_minutes ?? DEFAULT_REPEAT_MINUTES;
      const token = s.user?.expo_push_token;
      const pushEnabled = settings?.notify_via_push ?? true;
      const wh = settings ? toWorkHours(settings) : undefined;
      const outsideWorkHours = wh && isWorkHoursConfigured(wh) && !isInsideWorkHours(now, wh);

      if (outsideWorkHours && wh) {
        // Dồn reminder về đầu khung làm việc kế tiếp, không gửi push lúc này.
        const deferred = nextWorkStart(now, wh);
        this.logger.log(
          `⏸  Hoãn nhắc "${s.title}" tới ${deferred.toISOString()} (ngoài giờ làm việc)`,
        );
        await this.schedules.update(s.id, { remind_at: deferred });
        continue;
      }

      if (token && pushEnabled) {
        await this.push.send([
          {
            to: token,
            sound: 'default',
            title: '⏰ ' + s.title,
            body: s.description ?? 'Đã đến giờ!',
            data: { schedule_id: s.id, kind: 'start' },
          },
        ]);
      }
      // Đẩy remind_at về tương lai để cron tự nhắc lại nếu user ignore
      await this.schedules.update(s.id, {
        remind_at: new Date(now.getTime() + repeat * 60_000),
        is_reminded: true,
      });
    }
  }

  private async processEnd(now: Date): Promise<void> {
    const due = await this.schedules.find({
      where: {
        end_time: LessThanOrEqual(now),
        end_notified_at: IsNull(),
        status: 'pending',
      },
      relations: ['user', 'user.settings'],
      order: { end_time: 'ASC' },
      take: 100,
    });
    if (due.length === 0) return;

    for (const s of due) {
      const token = s.user?.expo_push_token;
      const pushEnabled = s.user?.settings?.notify_via_push ?? true;
      if (token && pushEnabled) {
        await this.push.send([
          {
            to: token,
            sound: 'default',
            title: '🏁 Kết thúc: ' + s.title,
            body: 'Lịch đã đến giờ kết thúc.',
            data: { schedule_id: s.id, kind: 'end' },
          },
        ]);
      }
      await this.schedules.update(s.id, { end_notified_at: now });
    }
  }
}

function toWorkHours(settings: {
  timezone?: string;
  work_start_hour?: number;
  work_end_hour?: number;
}): WorkHoursSettings {
  return {
    timezone: settings.timezone ?? 'Asia/Ho_Chi_Minh',
    work_start_hour: settings.work_start_hour ?? 0,
    work_end_hour: settings.work_end_hour ?? 0,
  };
}
